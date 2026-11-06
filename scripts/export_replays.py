"""Record current decision functions without editing the simulator or its existing exports."""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import subprocess
import sys
from datetime import datetime, timezone

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True, type=Path)
    args = parser.parse_args()
    source = args.source.resolve()
    root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(source))
    import contracts
    from engine.simulation import SimulationEngine
    from mind.quantum_mind import quantum_decide, classical_mixture_decide
    paths = sorted([source / 'contracts.py', *source.glob('engine/*.py'), *source.glob('mind/*.py'), source / 'data/priors.json'])
    hashes = {p.relative_to(source).as_posix(): digest(p) for p in paths}
    revision = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    dirty = bool(subprocess.check_output(['git', '-C', str(source), 'status', '--porcelain'], text=True).strip())
    manifest = dict(schemaVersion=1, generatedAt=datetime.now(timezone.utc).isoformat(),
                    sourceRepository='https://github.com/Muammal/Qiskit-Fest-Qognition',
                    sourceCommit=revision, sourceDirty=dirty, sourceHashes=hashes,
                    generator='scripts/export_replays.py', generatorSha256=digest(Path(__file__)),
                    runtime={n: importlib.metadata.version(n) for n in ['numpy','qiskit','scipy']},
                    backend='Local NumPy density-matrix and closed-form evaluation; no QPU execution.',
                    frameSemantics='After event, before action; state needs are satisfaction levels in [0,1].',
                    selection='Fixed demonstration cases: volcano seeds 42 and 91; island seed 42. Not selected by outcome. Not a benchmark.',
                    runs=[])
    output = root / 'public/runs'
    output.mkdir(parents=True, exist_ok=True)
    hero = None
    for scenario, seed in [('volcano',42), ('volcano',91), ('island',42)]:
        pair = []
        for policy, decide in [('quantum',quantum_decide), ('classical_mixture',classical_mixture_decide)]:
            assert decide.__module__ == 'mind.quantum_mind'
            sim = SimulationEngine(seed=seed, mind_type=policy, noise_source='numpy-density-matrix', decide_fn=decide, scenario=scenario)
            states = []
            shelters = []
            blocked = []
            while sim.agent.is_alive and len(sim.steps) < 36:
                before = {tuple(p) for y,row in enumerate(sim.world.tiles) for x,t in enumerate(row) if t == 4 for p in [(x,y)]}
                step = sim.step()
                if step is None:
                    break
                after = {tuple(p) for y,row in enumerate(sim.world.tiles) for x,t in enumerate(row) if t == 4 for p in [(x,y)]}
                shelters.append([list(p) for p in sorted(after-before)])
                h = sim.volcano.hazard_by_step[step['t']]
                arriving = set(map(tuple,h.get('active_pdc',[]))) | set(map(tuple,h.get('active_lahar',[])))
                blocked.append(tuple(step['state']['pos']) in arriving)
                states.append(sim.agent.get_state())
                assert step.get('quantum') is not None and not step['reason'].startswith('Stub')
            timeline = sim.timeline()
            again = SimulationEngine(seed=seed,mind_type=policy,noise_source='numpy-density-matrix',decide_fn=decide,scenario=scenario).run()
            assert timeline == again, f'Non-reproducible run: {scenario}/{seed}/{policy}'
            timeline['recording'] = dict(schemaVersion=1, sourceCommit=revision,
                policyImplementation=f'{decide.__module__}.{decide.__name__}',
                newSheltersAfterStep=shelters, executionBlockedByArrivingFlow=blocked,
                stateAfterStep=states, disclosure='Additional snapshots recorded by the exporter. Original engine and timeline fields are unchanged.')
            run_id = f'{scenario}-{seed}-{policy}'
            path = output / f'{run_id}.json'
            path.write_text(json.dumps(timeline,separators=(',',':'),allow_nan=False), encoding='utf-8')
            manifest['runs'].append(dict(id=run_id,scenario=scenario,seed=seed,mapSeed=timeline['world']['map_seed'],policy=policy,
                title=f'{"Volcano evacuation" if scenario == "volcano" else "Island wilderness"} · seed {seed}',
                path=f'/runs/{run_id}.json',sha256=digest(path),steps=len(timeline['steps']),
                outcome=timeline['outcome'],cause=timeline['cause'],policyImplementation=f'{decide.__module__}.{decide.__name__}'))
            pair.append(timeline)
            if hero is None:
                hero = dict(tiles=timeline['world']['initial_tiles'],elevation=timeline['world']['elevation'],
                            width=40,height=40,spawn=timeline['steps'][0]['state']['pos'])
            print(f'{run_id}: {len(timeline["steps"])} steps; {timeline["outcome"]}; repeat identical; {digest(path)[:12]}')
        assert pair[0]['world']['initial_tiles'] == pair[1]['world']['initial_tiles']
        assert pair[0]['world']['volcano'] == pair[1]['world']['volcano']
        assert pair[0]['world']['weather'] == pair[1]['world']['weather']
        assert pair[0]['steps'][0]['state'] == pair[1]['steps'][0]['state']
    assert hashes == {p.relative_to(source).as_posix():digest(p) for p in paths}, 'Source changed during recording'
    for parent in ['src/data','public/evidence']:
        (root/parent).mkdir(parents=True,exist_ok=True)
    text = json.dumps(manifest,indent=2)
    (output/'manifest.json').write_text(text,encoding='utf-8')
    (root/'src/data/run-manifest.json').write_text(text,encoding='utf-8')
    (root/'src/data/hero-world.json').write_text(json.dumps(hero,separators=(',',':')),encoding='utf-8')
    print(f'Source preservation: {len(hashes)} file hashes unchanged; dirty={dirty}')

if __name__ == '__main__':
    main()
