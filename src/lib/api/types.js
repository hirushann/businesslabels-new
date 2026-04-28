/**
 * API Response Type Definitions (JSDoc)
 *
 * These types mirror the Laravel API resource shapes exactly.
 * When the backend changes a resource, update the corresponding type here.
 *
 * @see Laravel: app/Http/Resources/
 */

// ─── Pagination ──────────────────────────────────────────────

/**
 * @typedef {Object} PaginationMeta
 * @property {number} current_page
 * @property {number} last_page
 * @property {number} per_page
 * @property {number} total
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} data
 * @property {PaginationMeta} meta
 */

// ─── Localized ───────────────────────────────────────────────

/**
 * @typedef {Object} LocalizedString
 * @property {string} en
 * @property {string} nl
 */

// ─── Auth ────────────────────────────────────────────────────

/**
 * @typedef {Object} LoginRequest
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} access_token
 * @property {string} token_type
 * @property {Object} user
 */

// ─── Profile ─────────────────────────────────────────────────

/**
 * @typedef {Object} Profile
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string|null} phone
 * @property {boolean} is_active
 * @property {string|null} type
 * @property {string|null} email_verified_at
 * @property {string|null} last_login_at
 * @property {number} login_count
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} UpdateProfileRequest
 * @property {string} [name]
 * @property {string} [email]
 * @property {string|null} [phone]
 */

/**
 * @typedef {Object} UpdatePasswordRequest
 * @property {string} current_password
 * @property {string} password
 * @property {string} password_confirmation
 */

// ─── Product ─────────────────────────────────────────────────

/**
 * @typedef {Object} ProductMaterial
 * @property {number} id
 * @property {LocalizedString} title
 * @property {LocalizedString} slug
 * @property {LocalizedString} [subtitle]
 * @property {{ id: number, name: LocalizedString, slug: LocalizedString }} [category]
 */

/**
 * @typedef {Object} ProductVariant
 * @property {number} id
 * @property {string} name
 * @property {string} sku
 * @property {number|null} price
 * @property {number|null} original_price
 * @property {number} stock
 * @property {boolean} in_stock
 * @property {Object<string, string>} attributes
 */

/**
 * @typedef {Object} GalleryImage
 * @property {number} id
 * @property {string} name
 * @property {string} file_name
 * @property {string} url
 */

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {'simple'|'variable'} type
 * @property {string} title
 * @property {LocalizedString} name
 * @property {LocalizedString} [subtitle]
 * @property {LocalizedString} slug
 * @property {string|null} sku
 * @property {string|null} article_number
 * @property {string|null} state
 * @property {number|null} price
 * @property {number|null} original_price
 * @property {number} stock
 * @property {boolean} in_stock
 * @property {LocalizedString|null} excerpt
 * @property {string|null} main_image
 * @property {number|null} material_id
 * @property {ProductMaterial|null} material
 * @property {Category[]} categories
 * @property {Object<string, string>} meta
 * @property {string} created_at
 * @property {string} updated_at
 *
 * Detail-only fields (present on show/showBySlug):
 * @property {LocalizedString} [description]
 * @property {LocalizedString} [content]
 * @property {string|null} [product_information]
 * @property {string|null} [product_template]
 * @property {string|null} [make]
 * @property {string|null} [material_information]
 * @property {string|null} [packaging_unit]
 * @property {string|null} [jeritech_stock]
 * @property {string|null} [delivery_dates_no_stock]
 * @property {string|null} [delivery_dates_in_stock]
 * @property {string|null} [packing_group]
 * @property {{ weight: number|null, width: number|null, height: number|null, length: number|null }} [dimensions]
 * @property {GalleryImage[]} [gallery_images]
 * @property {ProductVariant[]} [variants]
 */

/**
 * @typedef {Object} ProductListResponse
 * @property {Product[]} data
 * @property {PaginationMeta} meta
 * @property {number} in_stock_count
 */

// ─── Category ────────────────────────────────────────────────

/**
 * @typedef {Object} Category
 * @property {number} id
 * @property {LocalizedString} name
 * @property {LocalizedString} slug
 * @property {number|null} parent_id
 * @property {number} count
 * @property {{ id: number, name: LocalizedString, slug: LocalizedString }} [taxonomy]
 * @property {Category[]} [children]
 */

/**
 * @typedef {Object} CategoryGroup
 * @property {number} id
 * @property {LocalizedString} name
 * @property {LocalizedString} slug
 * @property {number} count
 * @property {Category[]} categories
 */

// ─── Filters ─────────────────────────────────────────────────

/**
 * @typedef {Object} FilterResponse
 * @property {Object} data
 * @property {Array} data.types
 * @property {Array} data.sort
 * @property {CategoryGroup[]} data.categories
 * @property {Array} data.filters
 * @property {Object} data.meta
 */

// ─── Order ───────────────────────────────────────────────────

/**
 * @typedef {Object} OrderItem
 * @property {number} id
 * @property {number} product_id
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 * @property {number} total
 */

/**
 * @typedef {Object} BillingAddress
 * @property {boolean} is_company
 * @property {string|null} company_name
 * @property {string} firstname
 * @property {string} lastname
 * @property {string|null} address
 * @property {string|null} city
 * @property {string|null} postalcode
 * @property {string|null} country_id
 */

/**
 * @typedef {Object} ShippingAddress
 * @property {string} name
 * @property {string} address
 * @property {string} city
 * @property {string} postalcode
 * @property {string|null} country_id
 */

/**
 * @typedef {Object} Order
 * @property {number} id
 * @property {string} number
 * @property {string} status
 * @property {string|null} notes
 * @property {number} user_id
 * @property {number} total
 * @property {OrderItem[]} items
 * @property {BillingAddress|null} billing_address
 * @property {ShippingAddress|null} shipping_address
 * @property {string} created_at
 * @property {string} updated_at
 */

// ─── Customer Address ────────────────────────────────────────

/**
 * @typedef {Object} CustomerAddress
 * @property {number} id
 * @property {'shipping'|'billing'} type
 * @property {string|null} name
 * @property {string|null} firstname
 * @property {string|null} lastname
 * @property {string|null} company_name
 * @property {string} address
 * @property {string|null} address2
 * @property {string} city
 * @property {string|null} postalcode
 * @property {string} country_id
 * @property {number|null} province_id
 * @property {string|null} phone
 * @property {string|null} email
 * @property {string} created_at
 * @property {string} updated_at
 */

// ─── Coupon ──────────────────────────────────────────────────

/**
 * @typedef {Object} Coupon
 * @property {number} id
 * @property {string} code
 * @property {string|null} description
 * @property {string} discount_type
 * @property {number} amount
 * @property {boolean} allow_free_shipping
 * @property {string|null} expiry_date
 * @property {number|null} minimum_spend
 * @property {number|null} maximum_spend
 * @property {boolean} individual_use
 * @property {boolean} exclude_sale_items
 * @property {number[]} product_ids
 * @property {number[]} exclude_product_ids
 * @property {number[]} category_ids
 * @property {number[]} exclude_category_ids
 * @property {string[]} allowed_emails
 * @property {number|null} usage_limit_per_coupon
 * @property {number|null} limit_usage_to_x_items
 * @property {number|null} usage_limit_per_user
 * @property {number} usage_count
 */

// ─── Customer Review ─────────────────────────────────────────

/**
 * @typedef {Object} CustomerReview
 * @property {number} id
 * @property {string} name
 * @property {number} rating  1-5
 * @property {string} comment
 * @property {string} source  e.g. 'manual' | 'google' | 'api'
 * @property {string|null} avatar  absolute URL or null
 * @property {number|null} product_id  null for site-wide reviews
 * @property {'simple'|'variable'|null} product_type
 * @property {string} created_at
 */

/**
 * @typedef {Object} CreateReviewRequest
 * @property {string} name
 * @property {string} [email]
 * @property {number} rating  1-5
 * @property {string} comment
 * @property {number} [product_id]
 * @property {'simple'|'variable'} [product_type]
 */

// ─── Printer ─────────────────────────────────────────────────

/**
 * @typedef {Object} Printer
 * @property {number} id
 * @property {LocalizedString} title
 * @property {LocalizedString} [subtitle]
 * @property {LocalizedString} slug
 * @property {LocalizedString} [excerpt]
 * @property {LocalizedString} [content]
 * @property {string} status
 * @property {string|null} template
 * @property {Object<string, string>} meta
 * @property {string} created_at
 * @property {string} updated_at
 */

export {};
