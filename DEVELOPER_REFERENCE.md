# RRventures Dashboard - Developer Quick Reference

## CSS Classes & Utilities

### Accessibility Classes
```css
.skip-link           /* Jump to main content for keyboard users */
[role="application"] /* Main app container */
[role="navigation"]  /* Sidebar navigation */
[role="main"]        /* Main content area */
```

### Mobile & Responsive
```css
.sidebar-toggle      /* Hamburger menu button (mobile only) */
.mobile-open         /* Class added to sidebar when menu open */
.sidebar.mobile-open { left: 0; } /* Slides in from left */
```

### Empty States
```css
.empty-state         /* Container for empty state UI */
.empty-state-icon    /* Large icon (3rem) */
.empty-state h3      /* Heading */
.empty-state p       /* Description text */
```

### Loading & Skeleton
```css
.skeleton            /* Shimmer animation container */
.skeleton-card       /* Loading placeholder for cards (120px height) */
.skeleton-text       /* Loading placeholder for text lines */
```

### Forms
```css
.form-label          /* Form label styling */
.form-input          /* Text, email, password inputs */
.form-textarea       /* Multi-line text input */
.form-hint           /* Helper text below input */
.form-counter        /* Character counter display */
.form-group          /* Container for label + input + hint */
```

### State Indicators
```css
.status-pill         /* Badge for status */
.status-active       /* Green status */
.status-paused       /* Orange status */
.status-draft        /* Indigo status */
```

### Buttons
```css
.btn                 /* Base button */
.btn-primary         /* Primary action (indigo) */
.btn-secondary       /* Secondary action (white) */
.btn-tertiary        /* Tertiary action (transparent) */
.btn:hover           /* Hover state */
.btn:focus           /* Focus state */
.btn:disabled        /* Disabled state */
.icon-btn            /* Button with icon + text */
```

---

## ARIA Attributes Reference

### Navigation
```html
<!-- Sidebar -->
<aside aria-label="Navigation" role="navigation">
  <button aria-label="Toggle navigation menu" 
          aria-expanded="false" 
          aria-controls="sidebar-nav">
    <i data-lucide="menu"></i>
  </button>
  <nav id="sidebar-nav">...</nav>
</aside>

<!-- Main -->
<main role="main" id="main-content">...</main>
```

### Forms
```html
<form aria-label="Login form">
  <label for="email">Email</label>
  <input id="email" type="email" />
</form>
```

---

## JavaScript Functions & Events

### Sidebar Toggle (Mobile)
```javascript
// Automatically set up on all pages via DOMContentLoaded
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

// Toggle behavior:
// 1. Adds/removes .mobile-open class
// 2. Updates aria-expanded attribute
// 3. Adds/removes body.sidebar-open for scroll prevention
// 4. Closes on click outside
```

### Rendering Functions with Empty States
```javascript
// Services
renderServiceRows(services)
// Shows table rows if data exists
// Shows empty state if services.length === 0

// Ads
renderAdCards(ads)
// Shows ad cards if data exists
// Shows empty state if ads.length === 0
```

### Form Handling
```javascript
// Character counter (customization page)
descriptionInput.addEventListener('input', () => {
  descriptionCount.textContent = descriptionInput.value.length;
});

// Form validation
validateForm() // Checks required fields and email format

// Notifications
showNotification(message, type = 'success')
// Types: 'success', 'error'
// Auto-dismisses after 4 seconds
```

---

## CSS Variables

### Colors
```css
--primary: #4F46E5              /* Indigo main */
--primary-soft: rgba(79, 70, 229, 0.12)
--bg: #F8FAFC                   /* Background */
--surface: #ffffff              /* Surface/cards */
--text: #0f172a                 /* Text color */
--muted: #475569                /* Muted text */
--border: rgba(15, 23, 42, 0.08) /* Border color */
```

### Effects
```css
--shadow: 0 20px 50px rgba(15, 23, 42, 0.08)
--shadow-soft: 0 10px 32px rgba(15, 23, 42, 0.08)
--radius: 22px                  /* Primary border radius */
```

---

## Responsive Breakpoints

| Breakpoint | Use Case | Changes |
|-----------|----------|---------|
| 1080px | Tablet view | Dashboard 2-col → 1-col, Analytics 2-col → 1-col |
| 820px | Mobile tablet | Sidebar fixed, Form 2-col → 1-col, Topbar flex-column |
| 620px | Small mobile | Reduced padding, smaller fonts |

---

## Keyboard Navigation

### All Pages
| Key | Action |
|-----|--------|
| Tab | Navigate to next focusable element |
| Shift+Tab | Navigate to previous focusable element |
| Enter | Activate button or submit form |
| Escape | Close modal or sidebar on mobile |
| Space | Toggle checkbox or button |

### Mobile
| Key | Action |
|-----|--------|
| Tab to toggle button | Focus hamburger menu |
| Enter/Space | Open/close sidebar |
| Click outside | Close sidebar |

---

## Adding Empty State to New Components

### Step 1: Check if data is empty
```javascript
if (items.length === 0) {
  // Show empty state
  return;
}
```

### Step 2: Create empty state HTML
```html
<div class="empty-state">
  <div class="empty-state-icon">🎯</div>
  <h3>No items found</h3>
  <p>Add your first item to get started.</p>
  <button class="btn btn-primary icon-btn" onclick="...">
    <i data-lucide="plus"></i>Create Item
  </button>
</div>
```

### Step 3: Insert in place of data
```javascript
container.innerHTML = emptyStateHTML;
// OR
container.appendChild(emptyStateElement);
```

---

## Adding Loading State

### Method 1: Skeleton Screens
```html
<div class="skeleton skeleton-card"></div>
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-text line-2"></div>
```

### Method 2: Loading Spinner
```html
<div class="loading-spinner">
  <i data-lucide="loader"></i>
  <span>Loading...</span>
</div>
```

### JavaScript Example
```javascript
// Show loading
container.innerHTML = loadingHTML;

// Simulate loading
setTimeout(() => {
  renderActualData(data);
}, 1000);
```

---

## Testing Focus States

### Keyboard Testing
1. Click inside the page (any input/button)
2. Press Tab repeatedly to navigate
3. Verify focus outline is visible at each step
4. Use Shift+Tab to go backward

### Screen Reader Testing
1. Use NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
2. Navigate with arrow keys
3. Verify all content is announced correctly
4. Check that form labels are properly associated

---

## Common Patterns

### Button with Icon
```html
<button class="btn btn-primary icon-btn">
  <i data-lucide="plus"></i>
  <span>Add Item</span>
</button>
```

### Form Group
```html
<div class="form-group">
  <label for="field" class="form-label">
    <span>Field Label</span>
    <span class="required">*</span>
  </label>
  <input id="field" type="text" class="form-input" />
  <span class="form-hint">Helper text here</span>
</div>
```

### Status Badge
```html
<span class="status-pill status-active">Active</span>
<span class="status-pill status-paused">Paused</span>
<span class="status-pill status-draft">Draft</span>
```

### Card
```html
<article class="panel-card">
  <div class="panel-header">
    <h2>Title</h2>
    <button class="btn btn-tertiary">Action</button>
  </div>
  <div class="panel-content">
    <!-- Content -->
  </div>
</article>
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Grid | ✅ | ✅ | ✅ | ✅ |
| Flexbox | ✅ | ✅ | ✅ | ✅ |
| CSS Variables | ✅ | ✅ | ✅ | ✅ |
| Media Queries | ✅ | ✅ | ✅ | ✅ |
| ARIA | ✅ | ✅ | ✅ | ✅ |
| Focus-visible | ✅ | ✅ | ⚠️ | ✅ |

---

## Performance Tips

1. **Animations**: Use `transform` and `opacity` for GPU acceleration
2. **Focus States**: Use `:focus-visible` instead of `:focus` for better UX
3. **Mobile**: Test on real devices, not just browser emulation
4. **Accessibility**: Use keyboard navigation during development

---

## Debugging

### Check Accessibility
```javascript
// In browser console
document.querySelectorAll('[aria-label]') // Find ARIA labels
document.querySelectorAll('[role]')       // Find roles
document.querySelectorAll(':focus')       // Find focused element
```

### Test Mobile Sidebar
```css
/* In browser DevTools, add to styles: */
.sidebar {
  outline: 2px solid red; /* See sidebar boundary */
}
```

### Focus Outline
```css
/* Ensure visible focus: */
*:focus-visible {
  outline: 3px solid blue;
  outline-offset: 4px;
}
```

---

## Further Resources

- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA: https://www.w3.org/WAI/ARIA/apg/
- Lucide Icons: https://lucide.dev/
- CSS Grid: https://developer.mozilla.org/en-US/docs/Web/CSS/grid
- Focus Management: https://webaim.org/articles/keyboard/
