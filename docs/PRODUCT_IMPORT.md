# Product import (CSV / Excel)

You can add many products at once using a **CSV** or **Excel** (.xlsx, .xls) file from **Admin → Products → Bulk Import (Excel/CSV)**.

## Quick steps

1. **Get category IDs**  
   In Admin go to **Categories**, note each category’s ID (e.g. from the URL or the table). Products need a `category` column with this ID.

2. **Get the template**  
   - In Admin → Products → Bulk Import, click **Download Template**, or  
   - Use the file: [`/product-import-template.csv`](/product-import-template.csv)

3. **Fill the file**  
   - One row = one product.  
   - **Required:** `title`, `price`.  
   - **Important:** `category` must be a **category ID** (from step 1), not the category name.

4. **Upload and import**  
   Upload the file in Bulk Import, check the preview, then click **Import all**.

## CSV format

- **Encoding:** UTF-8.
- **Separator:** Comma (`,`). If a value contains commas, wrap it in double quotes (`"..."`). Inside quoted text, escape a double quote as `""`.
- **Headers:** First row = column names. The parser accepts several name variants (e.g. `title`, `name`, `product name`; `category`, `category_id`; `image`, `thumbnail`, `thumb_src`).

### Required columns

| Column (example) | Description |
|------------------|-------------|
| `title`          | Product name. |
| `price`          | Number (e.g. `100` or `99.99`). |

### Important optional columns

| Column (example)   | Description |
|-------------------|-------------|
| `category`        | **Firestore category ID** (from Admin → Categories). Required for products to show in the right collection. |
| `description`     | Short description (also used as `shortDescription`). |
| `image` / `thumb_src` | Main image URL. |
| `gallery`         | Extra image URLs, comma-separated. |
| `stock`           | `yes` / `no` or `true` / `false`. Default: in stock. |
| `currency`        | e.g. `BDT`, `USD`. |

### Other optional columns

- `brand`, `model`, `slug`  
- `discount_price` (sale price)  
- `thumb_alt` (main image alt text)  
- `color`, `colors` (comma-separated, e.g. `red, blue, green`)  
- `sizes` (e.g. `S:10, M:20, L:15` = size name and quantity)  
- `size_prices` (e.g. `S:100, M:110, L:120` = size and price)  
- `highlights` (comma-separated)  
- `features` (comma-separated or JSON array)  
- `specifications` (JSON object, e.g. `{"material":"Cotton","weight":"200g"}`)  
- `resource` (admin-only notes)

## How the mechanism works

1. **Upload**  
   You select a `.csv`, `.xlsx`, or `.xls` file in the admin UI.

2. **Parse**  
   The app uses the first sheet (Excel) or the whole file (CSV), maps column names to product fields (with many accepted aliases), and parses each row into a product:
   - Numbers for `price`, `discount_price`, `rating`, `reviews`
   - Booleans for `stock` (e.g. `yes`/`no`/`true`/`false`)
   - Comma- or newline-separated lists for `colors`, `gallery`, `highlights`, `features`
   - Sizes: `S:10, M:20` → `{ S: 10, M: 20 }`
   - Size prices: `S:100, M:110` → `{ S: 100, M: 110 }`
   - JSON for `specifications`, `long_description`, `delivery` when the cell looks like JSON

3. **Validate**  
   Each row must have `title` and `price`. Missing `image`/`thumb_src` is allowed (stored as empty). Parsing errors are shown per row.

4. **Import**  
   On **Import all**, each parsed product is sent to `createProduct()` and saved to Firestore. Failures (e.g. permission or validation) are listed after the run; successful rows are created.

## Tips

- **Category ID:** If you use the category name by mistake, products won’t match any category. Always use the ID from Admin → Categories.
- **Commas in text:** Use double quotes around the whole value, e.g. `"Short, sweet description"`.
- **Excel:** Same columns work; the parser reads the first sheet.
- **Large files:** Import runs row by row; very large files may take a while. Check errors and fix the file if needed.
