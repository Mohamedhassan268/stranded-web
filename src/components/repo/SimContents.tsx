import { checklist, entityTitle, sourceName, type SimEntity } from "@/lib/qsim";

/** The builder's readiness chips and its "In this scenario" list. */
export function SimContents({ entities }: { entities: SimEntity[] }) {
  return (
    <>
      <h2 className="q-heading">In this scenario ({entities.length})</h2>
      <div className="check-chips" style={{ marginTop: 10 }}>
        {checklist(entities).map((item) => (
          <span className={item.done ? "check-chip" : "check-chip is-missing"} key={item.label}>
            {item.done ? "OK" : "No"} {item.label}
          </span>
        ))}
      </div>
      <ol className="entity-list">
        {entities.map((entity, index) => (
          <li key={index}>
            {entityTitle(entity)}
            <span>{sourceName(entity.source)}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
