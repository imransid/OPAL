import { useState, useEffect } from 'react';
import { getProducts, getCategories } from '../../lib/firestore';
import CardProduct from '../products/cardProduct';
import CardCategory from '../products/cardCategory';

export default function HomeFirebaseSection() {
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof getCategories>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-6 text-center">
        <span className="spinner-border text-dark" />
      </div>
    );
  }

  return (
    <>
      <section className="py-6">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="mb-2">Shop by category</h2>
            <p className="text-body opacity-8">Find what you love by collection</p>
            <a className="btn btn-link text-dark font-weight-bold px-0" href="/shop/">View all categories →</a>
          </div>
          <div className="row g-4">
            {categories.length === 0 ? (
              <p className="text-body-secondary">No categories yet.</p>
            ) : (
              categories.slice(0, 4).map((category) => (
                <div key={category.id} className="col-6 col-lg-3">
                  <CardCategory
                    thumb_src={category.thumb_src}
                    title={category.title}
                    collection={category.collection}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-6 bg-gray-100">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="mb-2">Featured products</h2>
            <p className="text-body opacity-8">Hand-picked favorites this season</p>
            <a className="btn btn-link text-dark font-weight-bold px-0" href="/shop/">View all →</a>
          </div>
          <div className="row g-4">
            {products.length === 0 ? (
              <p className="text-body-secondary">No products yet.</p>
            ) : (
              products.slice(0, 4).map((product) => (
                <div key={product.id} className="col-6 col-lg-3">
                  <CardProduct
                    thumb_src={product.thumb_src}
                    thumb_alt={product.thumb_alt || product.title}
                    color={product.color}
                    colors={product.colors}
                    title={product.title}
                    description={product.description}
                    price={product.price}
                    position="center"
                    productId={product.id}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
