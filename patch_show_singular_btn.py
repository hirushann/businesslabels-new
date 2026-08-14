import re

path = '/Users/hirushanperera/Sites/businesslabels-new/src/components/ProductPurchase.tsx'
with open(path, 'r') as f:
    content = f.read()

# First we need to remove the misplaced showSingularAddToCartBtn definition from the module scope if it was added incorrectly
# Wait, I checked and it was NOT added, because `isLabelProduct` match failed in the previous script!
# Oh, in the previous script I tried to replace `const isLabelProduct = type === 'simple' && ...`
# Let's insert it below `const [isWarrantyPopoverOpen, setIsWarrantyPopoverOpen] = useState(false);`

old_def = "  const [isWarrantyPopoverOpen, setIsWarrantyPopoverOpen] = useState(false);"
new_def = """  const [isWarrantyPopoverOpen, setIsWarrantyPopoverOpen] = useState(false);

  const showSingularAddToCartBtn = normalizedMoq !== null && normalizedPackingGroup !== null && normalizedMoq < normalizedPackingGroup && quantity < normalizedPackingGroup;"""

if old_def in content:
    content = content.replace(old_def, new_def)
else:
    print("Definition anchor not found")

with open(path, 'w') as f:
    f.write(content)
