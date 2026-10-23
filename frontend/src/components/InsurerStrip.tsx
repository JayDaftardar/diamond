import { INSURER_LOGOS } from '#/content/config'
import { m } from '#/lib/i18n'

/**
 * Insurance partners as a strip of logo tiles. A tile shows the insurer's logo once its
 * file is added to public/images/insurers/ and listed in INSURER_LOGOS (content/config.ts);
 * until then it shows the insurer's name, so the strip is complete from day one.
 */
export function InsurerStrip() {
  return (
    <ul className="insurer-strip" aria-label={m.insurance.title}>
      {m.insurance.partners.map((name) => {
        const logo = INSURER_LOGOS[name]
        return (
          <li key={name} className="insurer-strip__tile">
            {logo ? (
              <img
                src={`/images/insurers/${logo}`}
                alt={name}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span>{name}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
