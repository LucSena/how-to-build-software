# Checkout

Baymard Institute's large-scale checkout research is the primary evidence base here. Their documented average cart abandonment rate is about 70%, their benchmark average checkout has about 5 steps and 11 form fields while 7–8 fields (12–14 form elements) are achievable, and large e-commerce sites can gain on the order of 35% conversion from checkout design fixes. Unexpected extra costs are consistently the top stated reason for abandonment, with forced account creation, distrust, slow delivery, and complicated checkouts close behind (exact shares vary by survey year; use the current Baymard list rather than quoting old numbers).

## Contents
- Cost transparency
- Account and guest checkout
- Fields and addresses
- Payment
- Shipping and delivery
- Flow and layout
- Errors and recovery
- Trust
- Mobile checkout
- Audit checklist

---

## Cost transparency

- Show shipping, taxes, and fees in the cart, estimated from location if needed ("Estimated tax for 10115 Berlin"), and never introduce a new charge on the final step.
- Show the free-shipping threshold and progress honestly ("€12 away from free shipping").
- Currency and tax inclusion stated; totals in tabular numerals.
- Subscriptions in the cart: renewal price, period, and cancellation terms beside the line item.

## Account and guest checkout

- Guest checkout visible as a first-class option, not a small link under "Sign in".
- Returning customers: sign-in via email or passkey, or recognized by email with an optional sign-in.
- Offer account creation on the confirmation page using data already entered ("Save your details for next time: just add a password").
- Never require an account to buy unless the product genuinely needs one.

## Fields and addresses

- One "Full name" field unless the carrier needs split names.
- Email once, no confirmation field; phone only if the carrier needs it, with the reason stated ("For delivery updates only").
- Billing address = shipping address by default (checked checkbox), revealing billing fields only when unchecked.
- "Address line 2" collapsed behind "Add apartment, suite, etc." (Baymard found the visible line 2 field confuses users).
- Address autocomplete with manual entry always available; derive city and region from postcode where reliable.
- Coupon/promo code field collapsed behind a link, so visitors without a code do not leave to search for one.
- Mark required and optional fields explicitly.
- `autocomplete` on every field (`name`, `email`, `tel`, `shipping street-address`, `postal-code`, `cc-number`, `cc-exp`, `cc-csc`); correct keyboards.

## Payment

- Express wallets (Apple Pay, Google Pay, Shop Pay, PayPal, or regional methods) above the card form; they skip most fields.
- Offer the payment methods common in each market (cards, SEPA, iDEAL, Pix, UPI, BNPL where relevant).
- Card form: fields in the order printed on the card; number auto-formatted in groups; brand detected from digits (no brand dropdown); expiry accepts common formats; numeric keyboard.
- Visually enclose payment fields (a bordered panel with a lock icon and a short reassurance line); perceived security matters as much as actual security at this step.
- Button shows the amount: "Pay €84.20".
- Handle 3-D Secure and other challenges in-flow without losing the order.

## Shipping and delivery

- Show delivery as dates ("Arrives Thu 8 Oct – Sat 10 Oct") rather than "3–5 business days".
- Default to the option most people choose, with price and speed side by side as radio buttons.
- Returns policy summarized near the order summary and linked.

## Flow and layout

- Few, clearly named steps (e.g. Shipping → Payment → Review) or a well-structured single page; show progress.
- Remove site navigation, promos, and cross-sells during checkout ("enclosed checkout"), but keep help, contact, and returns info.
- Order summary visible on every step (sidebar on desktop, collapsible at the top on mobile) with product images, even for digital goods.
- Review step (or clear inline summary) before payment for high-value or complex orders.
- No CAPTCHAs in checkout; use invisible risk scoring instead.
- Confirmation page: order number, what happens next, delivery estimate, email confirmation sent, and the account-creation offer.

## Errors and recovery

- Validate inline on blur; keep all entered data on any error; scroll to and focus the first problem.
- Specific messages per failure: "The card number is missing a digit", "This postcode doesn't match Berlin", not "Invalid input".
- Declines: "Your bank declined this payment. Try another card or payment method." with the other methods one tap away; never clear the card form except the CVC if required.
- Preserve the cart across sessions and devices; restore after sign-in.
- Out-of-stock during checkout: say which item, offer alternatives or removal, keep the rest.

## Trust

- Company identity visible (logo, legal name in footer, contact), recognizable payment logos, clear returns and refund policy, reviews near the product rather than generic badges.
- Security reassurance at the payment step; third-party trust seals only if real.
- No surprise pre-selected add-ons (insurance, donations, subscriptions): optional add-ons unchecked.

## Mobile checkout

- Wallet buttons first; single column; sticky "Pay" button showing the total; 44 px+ targets.
- Inputs at 16 px or larger (no iOS zoom); `inputmode` and `autocomplete` everywhere.
- Radio buttons or segmented controls instead of dropdowns for short option sets (shipping speed, country shortlist).
- Keep the keyboard from covering the active field and the pay button.
- Test on real devices with real wallets.

## Audit checklist

- [ ] Total cost visible in the cart; no new fees at the last step.
- [ ] Guest checkout prominent; account offered after purchase.
- [ ] ≤ ~8 visible fields for a typical order; billing = shipping by default; line 2 and coupon collapsed.
- [ ] `autocomplete` and correct keyboards on every field.
- [ ] Express wallets above the form; relevant local payment methods.
- [ ] Card formatting, brand detection, enclosed payment panel, amount on the pay button.
- [ ] Delivery shown as dates; returns policy visible.
- [ ] Order summary visible throughout; navigation removed, help kept.
- [ ] Errors specific, inline, data preserved; decline path offers alternatives.
- [ ] No CAPTCHA, no pre-checked add-ons, no forced account.
- [ ] Tested on a real phone end to end.

## Sources

- Baymard Institute, cart abandonment rate statistics: https://baymard.com/lists/cart-abandonment-rate
- Baymard Institute, checkout usability research overview: https://baymard.com/research/checkout-usability
- Baymard Institute, average checkout form fields: https://baymard.com/blog/checkout-flow-average-form-fields
- Baymard Institute, checkout flow optimization: https://baymard.com/blog/checkout-flow-ux-optimization
- Baymard Institute, Address Line 2: https://baymard.com/blog/address-line-2
- Baymard Institute, inline form validation: https://baymard.com/blog/inline-form-validation
- Baymard Institute, required and optional fields: https://baymard.com/blog/required-optional-form-fields
- HTML autofill tokens (WHATWG): https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
