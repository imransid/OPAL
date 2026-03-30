import type { ReactElement } from 'react';

interface Props {
  images: {
    src: string;
    alt: string;
  }[];
  data: Record<string, string>;
}

export default function ProductFeatureTabs({ images, data }: Props) {
  const tabs: ReactElement[] = [];

  Object.entries(data).forEach(([title, value], idx) => {
    if (idx !== 0) {
      tabs.push(
        <div
          className="tab-pane active show"
          key={title}
          id={'tab' + idx}
          role="tabpanel"
          aria-labelledby="#profile"
        >
          <div className="row mt-5">
            <div className="col-12 col-lg-6 mb-lg-0 mb-4 pe-10">
              <h5 className="mt-5 mb-4">{title}</h5>
              <p>{value}</p>
            </div>

            <div className="col-12 col-lg-6 mb-lg-0 mb-4">
              <img className="w-100 rounded-3" src={images[0]?.src} alt={images[0]?.alt ?? ''} />
            </div>
          </div>
        </div>
      );
    }
  });

  return (
    <>
      <div className="accordion mt-5" id="accordionEcommerce">
        {tabs}
      </div>
    </>
  );
}
