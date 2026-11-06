# Qognition website

The public website for Qognition, a research project that tests a two-qubit model of decision-making against classical minds in evacuation scenarios. Simulator source: https://github.com/Muammal/Qiskit-Fest-Qognition . Live site: https://stranded-qognition-268.vercel.app .

The site uses the simulator's colours and panel layout, as an ordinary website. It is a model, not a prediction.

## Run

Node 24. Install with `npm ci`, start with `npm run dev` (port 3107), check with `npm run typecheck`, build with `npm run build`.

## Test

- `npm run test:data` checks the recordings, the `.qsim` file checks, and both stores. The Redis store runs against a stand-in for Upstash, not the real service.
- `npm test` builds the site into `.next-test/`, serves it on port 3108 with a throwaway data file, and runs the browser tests in Microsoft Edge. It can run while `npm run dev` is up.

## Routes

- `/`: home page, with the latest posts, headline results and the five scenarios.
- `/blog/`: posts generated from writing in the simulator repository.
- `/demo/`: step through recorded runs and compare models.
- `/repo/`: the Public Repo, where people post `.qsim` files and review them.
- `/docs/`: documentation generated from the simulator repository.
- `/science/`: method, evidence and limits.
- `/team/`: team cards, read from `src/data/team.ts`. Edit that file to add people.
- `/cinematic/`: the 3D story.
- `/privacy/`: what the site stores.

## Documentation and blog posts

Files in `src/content/`, `public/docs-assets/` and `public/licences/`, plus `src/data/docs.json` and `src/data/community-sims.json`, are generated. Don't edit them by hand. To update them, or to add a post or page to the lists at the top of the script:

```bash
node scripts/sync_docs.mjs --source /absolute/path/to/Qiskit-Fest-Qognition
```

The script reads everything before it writes, so a moved file stops it without changing anything here. Each post's date is the day its file last changed in the simulator repository.

## Public Repo

The site runs on a server now, not as a static export, because posts need somewhere to go.

| Setting | What it does |
| --- | --- |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | An Upstash Redis database. Vercel sets these when one is connected. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` also work. |
| `MODERATION_TOKEN` | Lets you remove posts. With none set, nobody can. |
| `RATE_LIMIT_SALT` | Any long random string, used when hashing addresses for rate limits. |
| `REPO_DATA_FILE` | Where the local data file goes. Defaults to `.data/repo.json`. |

Without a database on Vercel the site stays up, shows the three team sims, and turns posting off. Locally, posts go to a JSON file.

To remove a sim or a review:

```bash
curl -X DELETE -H "Authorization: Bearer $MODERATION_TOKEN" https://your-site/api/sims/SIM_ID/
```

```bash
curl -X DELETE -H "Authorization: Bearer $MODERATION_TOKEN" https://your-site/api/sims/SIM_ID/reviews/REVIEW_ID/
```

Uploads are checked in `src/lib/qsim.ts`, which follows the file rules of the simulator's `stranded_physics/entities/simfile.py`: format, version, fields, hash, seed, text and size limits. The simulator's full scenario rules live in Python, so the app checks a file again when it opens it. Sims are limited to five uploads an hour per address, and reviews to twenty an hour and three a day per sim. There are no accounts, so these limits are a brake, not a guarantee. Keep an eye on what gets posted.

## Recordings

`public/runs/manifest.json` pins source revision, source hashes, callable policies, dependency versions, seeds and recording hashes. Six complete JSON files cover volcano seeds 42/91 and island seed 42 under quantum and classical-mixture conditions. These are fixed demonstration cases, not a benchmark. Every export is regenerated twice and checked for equality. The terrain is generated, and no restricted raw geographic data is included.

To regenerate, run `python scripts/export_replays.py --source /absolute/path/to/qognition` using an environment containing the simulator's dependencies. This imports the simulator but does not copy or modify its source. Recordings hold terrain types only, not the app's fruit trees or streams.

## Licences

Documentation text comes from the simulator repository under the Apache License 2.0, and community sims are CC BY 4.0. Copies of both, with the project's notice, are served from `/licences/`, and the footer links to them. Raw data from `disaster_data/` is not used here: it has separate terms.
