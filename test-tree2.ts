import { fetchCategoryGroups } from "./src/lib/categories/tree";
fetchCategoryGroups().then(groups => console.log(JSON.stringify(groups, null, 2)));
