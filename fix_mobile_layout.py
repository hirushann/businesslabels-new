import re

path = '/Users/hirushanperera/Sites/businesslabels-new/src/components/ProductPurchase.tsx'
with open(path, 'r') as f:
    content = f.read()

mobile_old = """        {/* Row 2: Add to Cart Button(s) */}
        <div>
          {isLabelProduct ? (
            <div className="flex items-center gap-3">
              {allowSingulars ? ("""

mobile_new = """        {/* Row 2: Add to Cart Button(s) */}
        <div>
          {isLabelProduct ? (
            <div className="flex flex-col gap-3 w-full">
              {allowSingulars ? ("""

if mobile_old in content:
    content = content.replace(mobile_old, mobile_new)
else:
    print("Mobile chunk not found")

with open(path, 'w') as f:
    f.write(content)
