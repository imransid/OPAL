import { useState, useEffect } from 'react';
import { getCategories } from '../../lib/firestore';

interface Props {
  title?: string;
}

export default function StoreDoubleColumn({ title = 'Categories' }: Props) {
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const topLevel = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => c.parentId);

  if (topLevel.length === 0) return null;

  const col1 = topLevel.slice(0, Math.ceil(topLevel.length / 2));
  const col2 = topLevel.slice(Math.ceil(topLevel.length / 2));

  return (
    <div className="row mt-5">
      <div className="col-12 col-lg-6 mb-4 mb-lg-0">
        <h6 className="w-100 pb-3 border-bottom">{title}</h6>
        <ul className="nav flex-column pt-2">
          {col1.map((cat) => {
            const subs = subCategories.filter((s) => s.parentId === cat.id);
            return (
              <li key={cat.id} className="nav-item">
                <a className="nav-link text-body text-sm" href={`/shop/?category=${cat.id}`}>
                  {cat.title}
                </a>
                {subs.length > 0 && (
                  <ul className="list-unstyled ms-3">
                    {subs.map((sub) => (
                      <li key={sub.id}>
                        <a className="nav-link text-body text-sm py-1" href={`/shop/?category=${sub.id}`}>
                          {sub.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="col-12 col-lg-6 mb-4 mb-lg-0">
        <h6 className="w-100 pb-3 border-bottom">&nbsp;</h6>
        <ul className="nav flex-column pt-2">
          {col2.map((cat) => {
            const subs = subCategories.filter((s) => s.parentId === cat.id);
            return (
              <li key={cat.id} className="nav-item">
                <a className="nav-link text-body text-sm" href={`/shop/?category=${cat.id}`}>
                  {cat.title}
                </a>
                {subs.length > 0 && (
                  <ul className="list-unstyled ms-3">
                    {subs.map((sub) => (
                      <li key={sub.id}>
                        <a className="nav-link text-body text-sm py-1" href={`/shop/?category=${sub.id}`}>
                          {sub.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
