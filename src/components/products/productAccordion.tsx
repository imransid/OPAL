import type { ReactElement } from 'react';

interface Props {
  data: Record<string, string>;
}

export default function ProductAccordion({ data }: Props) {
  const accordion: ReactElement[] = [];

  Object.entries(data).forEach(([title, value], idx) => {
    if (idx !== 0) {
      accordion.push(
        <div className="accordion-item" key={title}>
          <h5 className="accordion-header" id={'heading' + idx}>
            <button
              className="accordion-button border-bottom font-weight-bold py-4"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target={'#collapse' + idx}
              aria-expanded="false"
              aria-controls={'collapse' + idx}
            >
              {title}
              <i className="collapse-close fa fa-plus text-xs pt-1 position-absolute end-0 me-3" aria-hidden="true" />
              <i className="collapse-open fa fa-minus text-xs pt-1 position-absolute end-0 me-3" aria-hidden="true" />
            </button>
          </h5>
          <div
            id={'collapse' + idx}
            className="accordion-collapse collapse"
            aria-labelledby={'heading' + idx}
            data-bs-parent="#accordionEcommerce"
          >
            <div className="accordion-body text-body text-sm opacity-8">{value}</div>
          </div>
        </div>
      );
    } else {
      accordion.push(
        <div className="accordion-item" key={title}>
          <h5 className="accordion-header" id={'heading' + idx}>
            <button
              className="accordion-button border-bottom font-weight-bold collapsed py-4"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target={'#collapse' + idx}
              aria-expanded="true"
              aria-controls={'collapse' + idx}
            >
              {title}
              <i className="collapse-close fa fa-plus text-xs pt-1 position-absolute end-0 me-3" aria-hidden="true" />
              <i className="collapse-open fa fa-minus text-xs pt-1 position-absolute end-0 me-3" aria-hidden="true" />
            </button>
          </h5>
          <div
            id={'collapse' + idx}
            className="accordion-collapse collapse show"
            aria-labelledby={'heading' + idx}
            data-bs-parent="#accordionEcommerce"
          >
            <div className="accordion-body text-body text-sm opacity-8">{value}</div>
          </div>
        </div>
      );
    }
  });

  return (
    <>
      <div className="accordion mt-5" id="accordionEcommerce">
        {accordion}
      </div>
    </>
  );
}
