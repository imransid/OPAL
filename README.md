# OPAL — E-commerce Store

Modern e-commerce site built with **Astro** and React. Clean, fast, and ready to customize.

## Features

- **Home** — Hero, featured products, shop by category, testimonials
- **Shop** — Full catalog with filters and product grid
- **Product pages** — Detail view with gallery, description, reviews, add to cart
- **Shopping cart** — Cart summary and quantity updates
- **Checkout** — Shipping, payment, and order summary

## Tech stack

- [Astro](https://astro.build) — Static site generator
- React — Interactive components (cart, filters, forms)
- Bootstrap 5 — Layout and components
- SCSS — Theming

## Commands

| Command        | Action                          |
|----------------|---------------------------------|
| `npm run dev`  | Dev server at `localhost:4321`  |
| `npm run build`| Production build to `./dist/`   |
| `npm run preview` | Preview production build    |

## Project structure

```
src/
├── components/   # React & shared UI (navbar, footer, product cards, cart, checkout)
├── layouts/     # Layout.astro
└── pages/       # index (home), shop, product/[id], shopping-cart, checkout
public/
├── data.json    # Products, categories, reviews, orders (replace with API later)
└── images/
```

## License

MIT
