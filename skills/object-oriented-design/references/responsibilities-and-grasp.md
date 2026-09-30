# Responsibilities, Roles, and GRASP

Use this file to decide which object owns a behavior, to run a quick design pass before writing classes, or to split a class that has grown into a god object.

## Contents
1. Design from messages, not nouns
2. A 15-minute CRC pass
3. Role stereotypes
4. GRASP — all nine principles
5. Tell, don't ask and the Law of Demeter, in detail
6. Naming classes honestly
7. Splitting a god object

## 1. Design from messages, not nouns

Noun extraction ("the spec mentions Customer, Order, Invoice, so those are the classes") produces data holders with the behavior scattered in services. Start instead from the **messages** a client needs to send and the answers it needs back:

1. Write the use case as a short sequence of requests: "place order for cart at time *t* with payment method *p*".
2. For each request, ask *who should receive this message?* The answer is the object that has the information and the authority to keep the result valid.
3. Only then give that receiver a name and a type.

Sandi Metz's *Practical Object-Oriented Design* makes this point (paraphrased): you don't send messages because you have objects; you have objects because you send messages. Alan Kay, who coined the term, likewise described OOP as mainly about messaging and hiding state, not about classes.

## 2. A 15-minute CRC pass

CRC cards (Beck and Cunningham, OOPSLA 1989) hold three things per candidate: **Class**, **Responsibilities** (what it knows and does), **Collaborators**. A text version works as well as index cards:

```
Cart
  knows: lines, currency
  does:  add(item, qty), remove(sku), total()
  collaborates with: PriceList (lookup), Money
CheckoutController (use-case handler)
  does:  placeOrder(cartId, paymentMethod, now)
  collaborates with: CartRepository, PaymentGateway, OrderRepository, Clock
```

Procedure:
- [ ] List 3–5 scenarios (happy path, one failure, one edge case).
- [ ] Walk each scenario aloud, handing the message to the card that should answer it.
- [ ] A card with more than about 5 responsibilities, or with responsibilities of two stereotypes (section 3), gets split.
- [ ] A card that only forwards messages gets merged into its caller or callee.
- [ ] A card nobody sends a message to is deleted.

## 3. Role stereotypes

From Rebecca Wirfs-Brock's responsibility-driven design. Use them to name and review classes.

| Stereotype | Does | Typical name shape | Smell when it also… |
|---|---|---|---|
| Information holder | Knows and provides facts | `Invoice`, `Money`, `Address` | …makes decisions for other objects |
| Structurer | Maintains relationships between objects | `OrgChart`, `Catalog`, `Graph` | …performs business calculations |
| Service provider | Does a specific piece of work on request | `TaxCalculator`, `PdfRenderer` | …holds long-lived state |
| Coordinator | Reacts to events by delegating to others | `OrderFulfillment` | …contains business rules itself |
| Controller | Makes decisions and directs others | `CheckoutController`, a state machine | …holds lots of data (god object) |
| Interfacer | Translates between parts of the system or to outside systems | `StripeGateway`, `UserDto` mapper | …leaks the vendor's types inward |

A class that is two stereotypes at once is a candidate to split along that line.

## 4. GRASP — all nine principles

Craig Larman's *Applying UML and Patterns* names nine principles for assigning responsibilities. Two do most of the work on agent-written code: **Information Expert** (fixes logic that pulls data out of entities) and **Protected Variations** (stops abstraction layers at points of no real variation).

### Give the work to the Information Expert
**Rule.** Assign a responsibility to the object that has the information needed to fulfil it.
**Apply when.** A method reads several fields of another object to compute something about that object.
**Do / Avoid.** Do `order.total()` summing its own lines. Avoid `OrderCalculator.total(order.getLines(), order.getDiscount())`.
**Why.** Keeps the invariant and the data together; it is the direct fix for the Feature Envy smell and for anemic "service" classes.

### Let the aggregator create (Creator)
**Rule.** B creates A when B contains or aggregates A, closely uses A, or holds A's initializing data.
**Apply when.** Deciding where `new OrderLine(...)` belongs.
**Do / Avoid.** Do `order.addLine(sku, qty, price)` constructing the line. Avoid callers assembling lines and pushing them into `order.lines`.
**Why.** The creator can enforce the invariants that span the whole (line count limits, currency match) at creation time.

### Route each use case through one Controller
**Rule.** A non-UI object receives a system operation and coordinates it: load, delegate, persist, emit.
**Apply when.** A request handler, a UI view model, or a job needs to run a business operation.
**Do / Avoid.** Do a `PlaceOrder` handler that calls `cart.checkout(now)` and saves. Avoid business rules inside HTTP route functions or UI components.
**Why.** Keeps delivery mechanisms (HTTP, CLI, queue, UI) thin and replaceable; the controller itself should hold little state and no domain rules.

### Keep coupling low
**Rule.** Prefer designs where a class depends on few others, and on stable ones.
**Apply when.** Choosing between two assignments of a responsibility.
**Do / Avoid.** Do pass a `Money` value into `invoice.applyCredit(amount)`. Avoid `invoice.applyCredit(customer)` reaching into the customer's account.
**Why.** Every dependency is a reason the class may have to change and a thing to set up in tests.

### Keep cohesion high
**Rule.** A class's responsibilities should be closely related and use the same data.
**Apply when.** A class has methods that touch disjoint sets of fields.
**Do / Avoid.** Do split `UserProfile` (display data) from `Credentials` (password hash, MFA). Avoid a `User` class that renders avatars and verifies TOTP codes.
**Why.** Low cohesion means unrelated changes collide in one file and one test suite.

### Use polymorphism for variation you own and expect
**Rule.** When behavior varies by type across an open set, give each type its own implementation of one operation.
**Apply when.** Variants are added by other teams or plugins and the set of operations is stable.
**Do / Avoid.** Do `interface PaymentProvider { charge(...) }` for Stripe, Adyen, and an in-house ledger. Avoid replacing a `switch` over a closed union you own when new operations are added often (see `composition-and-polymorphism.md`).
**Why.** Dispatch removes repeated type switches only when types, not operations, are what change.

### Fabricate a class to protect cohesion (Pure Fabrication)
**Rule.** Invent a class that is not a domain concept when putting the job on a domain object would pollute it.
**Apply when.** Persistence, messaging, clock access, or formatting would otherwise live on entities.
**Do / Avoid.** Do an `OrderRepository` or `EmailGateway`. Avoid `order.saveToDatabase()` or `order.sendConfirmationEmail()`.
**Why.** Keeps domain objects free of I/O so they stay pure and cheap to test.

### Add indirection only to decouple something real
**Rule.** Put an intermediate object between two parts only when it removes a coupling you can name.
**Apply when.** A domain module would otherwise import a vendor SDK or a framework type.
**Do / Avoid.** Do an adapter between checkout and the payment SDK. Avoid a `UserService` that forwards every call to `UserRepository`.
**Why.** Indirection costs a hop for every reader; it pays only when it isolates change.

### Protect only variations you can name (Protected Variations)
**Rule.** Wrap points of *predicted* variation or instability behind a stable interface.
**Apply when.** There is a second provider, a platform difference, or a vendor you already plan to swap.
**Do / Avoid.** Do a `Storage` interface when you run S3 in production and the filesystem locally. Avoid an interface in front of your own pure pricing function "in case it changes".
**Why.** Speculative seams are paid for on every read and are usually in the wrong place when real variation arrives.

## 5. Tell, don't ask and the Law of Demeter, in detail

**Tell, don't ask** keeps decisions with the data:

```ts
// ask (logic outside the object, invariant duplicated in every caller)
if (account.balance >= amount) { account.balance -= amount; }
// tell
account.withdraw(amount); // throws or returns an InsufficientFunds result
```

Fowler's own entry on the rule says he rarely uses it as such; what matters is co-locating data and behavior. Keep queries (`account.balance()`) for display and reporting. Don't move formatting, rendering, or export code into domain objects just to avoid a getter.

**Law of Demeter** — a method may call methods on: itself, its parameters, objects it creates, and its own fields.

| Case | Verdict |
|---|---|
| `order.customer().address().country().taxRate()` in pricing logic | Violation: pricing now depends on four structures. Add `order.taxRate()` or pass `taxRate` in |
| `items.filter(isActive).map(toDto)` | Fine: one collection pipeline |
| `QueryBuilder.select().where().limit()` | Fine: fluent API returning the same kind of object |
| `response.data.user.email` on a parsed DTO | Fine: plain data, no behavior hidden behind it |
| A view template reading `@order.customer.address.city` | Violation in Metz's rule set: give the view one object exposing what it shows |

## 6. Naming classes honestly

- Name the **role or concept**, not the implementation (`Invoice`, `RateLimiter`, `PaymentGateway`), never glue words (`Manager`, `Helper`, `Util`, `Processor`, `Data`, `Info`, `Impl`). Kevlin Henney calls these "Lego names".
- A noun-ified verb with one method (`EmailSender.send`, `ReportGenerator.generate`) is usually a function; keep it as a class only if it holds configuration or a connection that callers shouldn't see.
- When a name is hard, write the completely honest long name first (`ParseCsvAndSaveAndNotify`). Each "And" is a split point (Arlo Belshee, "Naming is a Process").
- Tag-cloud check: if `data`, `info`, `manager`, `handle`, `process` outnumber domain words in a module, the model is missing concepts.

## 7. Splitting a god object

- [ ] Pin behavior with characterization tests at the class's public API.
- [ ] Group fields by which methods use them (a quick table: method → fields touched). Clusters that share no fields are separate objects.
- [ ] Name each cluster by role stereotype and domain concept. No name → not yet a real concept; leave it.
- [ ] Extract one cluster at a time (Extract Class), keeping the old public methods as thin delegates so callers don't change yet.
- [ ] Move callers to the new objects gradually; delete delegates when unused.
- [ ] Stop when each class passes the "invariant, role, or resource" test and the tests are green.

## Sources

- Kent Beck and Ward Cunningham, "A Laboratory for Teaching Object-Oriented Thinking" (OOPSLA 1989): http://c2.com/doc/oopsla89/paper.html
- Rebecca Wirfs-Brock and Alan McKean, *Object Design: Roles, Responsibilities, and Collaborations* (2002)
- Craig Larman, *Applying UML and Patterns* (GRASP); overview: https://en.wikipedia.org/wiki/GRASP_(object-oriented_design)
- Sandi Metz, *Practical Object-Oriented Design* (2nd ed., 2018); "Sandi Metz' Rules for Developers" (thoughtbot): https://thoughtbot.com/blog/sandi-metz-rules-for-developers
- Alan Kay on the meaning of OOP (email to Stefan Ram, 2003): http://userpage.fu-berlin.de/~ram/pub/pub_jf47ht81Ht/doc_kay_oop_en
- Martin Fowler, "TellDontAsk": https://martinfowler.com/bliki/TellDontAsk.html
- Law of Demeter (hacker-laws): https://github.com/dwmkerr/hacker-laws#the-law-of-demeter
- Steve Yegge, "Execution in the Kingdom of Nouns" (2006): https://steve-yegge.blogspot.com/2006/03/execution-in-kingdom-of-nouns.html
- Kevlin Henney, "Seven Ineffective Coding Habits of Many Programmers": https://www.slideshare.net/Kevlin/seven-ineffective-coding-habits-of-many-programmers-45312038
- Arlo Belshee, "Naming is a Process": https://arlobelshee.com/naming-is-a-process-part-7-intent-to-domain-abstraction/
- charlax, code antipatterns: https://github.com/charlax/professional-programming/blob/master/antipatterns/code-antipatterns.md
