import { listCategories } from './src/lib/api/categories.js';
async function test() {
  try {
    const data = await listCategories();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
