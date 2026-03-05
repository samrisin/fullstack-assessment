# StackShop — Bug Fixes & Enhancements

This document outlines every bug identified in the original StackShop codebase, how each was fixed, the reasoning behind each approach, and the enhancements made beyond the bug fixes.

---

## Bug Fixes

### 1. Subcategory Dropdown Showing All Subcategories Regardless of Selected Category

**Problem**

The subcategory `useEffect` fetched from `/api/subcategories` with no query parameters, so the API had no way to filter by category and returned every subcategory in the database regardless of what the user selected.

**Why this approach**

The API already supported a `category` filter — it just wasn't being used. This is the simplest, most correct fix with no changes needed on the backend.

---

### 2. Category & Subcategory Select Not Clearing in the UI

**Problem**

When "Clear Filters" was clicked, `setSelectedCategory(undefined)` and `setSelectedSubCategory(undefined)` were called. While this cleared the state value, shadcn's `Select` component did not visually reset — it continued showing the previously selected option. This is because passing `undefined` to a controlled `Select` makes it behave as uncontrolled, causing it to ignore subsequent value changes.

**Fix**

Change state type from `string | undefined` to `string`, initialise with `""`, and reset to `""` instead of `undefined`.

**Why this approach**

shadcn's `Select` relies on a controlled `value` prop. An empty string `""` is a valid controlled value that correctly signals "no selection" and causes the placeholder to re-render. Switching to `""` keeps the component fully controlled at all times.


### 3. External Image Hostnames Not Configured

**Problem**

`next/image` requires all external image hostnames to be explicitly whitelisted in `next.config.js`. Product images from Amazon were being blocked with the error:

```
Invalid src prop on `next/image`, hostname "images-na.ssl-images-amazon.com" is not configured
```

Two separate Amazon domains were encountered:
- `images-na.ssl-images-amazon.com`
- `m.media-amazon.com`

**Fix**

Add both domains to `remotePatterns` in `next.config.js` using the `**` wildcard to cover all subdomains:

**Why this approach**

Using `**` as a subdomain wildcard future-proofs the config against other Amazon image subdomains (e.g. `i.media-amazon.com`, `g.media-amazon.com`) without needing to add entries one by one each time a new one is encountered.

---

### 4. Only 20 static products were shown, no way to load more products.

**Problem**
No products were loaded after we reached end of the scroll it seemed like there are only 20 products but when we loaded products by category more products were shown. So the problem was after initial call of the products, no more calls were made to fetch more products.


**Fix**
Infinite scroll is added on the basis of current API, that uses pagination to fetch the data.

**Why this approach**
An alternate approach could have been to add a button that says `Load More products` but that required users input after every page. This method is much more seamless. Also `IntersectionObserver` is the modern, performant standard for this pattern. Unlike `window.scroll` listeners it does not fire on every scroll frame, has no need for debouncing, and is natively supported in all modern browsers.

## Enhancements

### 1. Infinite Scroll with `IntersectionObserver`

**What was added**

Replaced the static 20-product limit with infinite scroll. As the user scrolls to the bottom of the page, the next batch of products is automatically fetched and appended.

**Implementation details**

- A `sentinelRef` div is placed at the bottom of the page and watched by an `IntersectionObserver`.
- `offset` state tracks how many products have been loaded.
- `loadingMore` prevents duplicate requests.
- A "You've reached the end" message is shown when `hasMore` becomes `false`.

### 2. Hover Tooltips for Truncated Text

**What was added**

- Hovering the product title shows a custom tooltip with the full title text.
- Hovering either badge (category or subcategory) shows its full text in a tooltip.

**Why**

Product titles and category names are truncated for visual consistency. Without a way to see the full text, users have no way to read long names without clicking on the title.
---

### 3. Consistent Card Heights with Truncated Badges

**What was added**

- Category and subcategory badges are capped at `max-w-[110px]` with `truncate` to prevent long names from wrapping and pushing card content out of alignment.

**Why**

Without a fixed width, cards with long category names had taller footers than others, making the grid look uneven. Constraining badge width ensures all cards maintain a uniform layout.
