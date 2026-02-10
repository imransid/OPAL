interface Props {
  thumb_src: string;
  title: string;
  collection?: string;
  classList?: string;
  cta?: string;
  productCount?: number;
  /** When set, links to shop filtered by this category id */
  categoryId?: string;
}

export default function CardCategory({
  thumb_src,
  title,
  collection,
  classList = "",
  cta,
  productCount,
  categoryId,
}: Props) {
  const classBody = ((cta != null && cta !== "") ? "align-items-end d-flex" : "text-center w-100 pt-8");
  const shopHref = categoryId ? `/shop/?category=${encodeURIComponent(categoryId)}` : "/shop/";

  return (
    <>
      <a href={shopHref} className="d-block h-100 w-100 text-decoration-none">
        <div className={`card card-background align-items-start mb-4 mb-lg-0 h-100 w-100 d-flex flex-column ${classList}`}>
            <div
              className="full-background"
              style={{
                backgroundImage: thumb_src
                  ? `url(${thumb_src.startsWith('http') || thumb_src.startsWith('gs') ? thumb_src : `${import.meta.env.BASE_URL}${thumb_src}`})`
                  : 'none',
                backgroundSize: 'cover',
                backgroundColor: thumb_src ? undefined : '#e9ecef',
              }}
          />
          <div className={`card-body mt-auto ${classBody}`}>
            <div className="d-block mt-10">
              <p className="text-white font-weight-bold mb-1">{collection ?? title}</p>
              <h4 className="text-white font-weight-bolder">{title}</h4>
              {productCount != null && (
                <p className="text-white text-sm opacity-90 mb-1">{productCount} Products</p>
              )}
              <span className="text-white text-sm font-weight-semibold mb-0">See products &#62;</span>
            </div>
          </div>
        </div>
      </a>
    </>
  );
}
