# Stripe Checkout — wzorzec BLIK dla płatności jednorazowych

Status: **zweryfikowane eksperymentalnie 2026-10-07**

## Cel

Zachować sprawdzony mechanizm Stripe Checkout, który udostępnia BLIK bez implementowania osobnego formularza BLIK i bez ręcznego tworzenia PaymentIntent.

Ten dokument jest wzorcem do ponownego użycia w BOS i przyszłych projektach.

## Zweryfikowany mechanizm

Warunki po stronie aplikacji:

1. Stripe Checkout działa w trybie `mode: "payment"`.
2. `line_items` używa **jednorazowej** ceny Stripe (one-time Price), nie ceny cyklicznej.
3. Nie ustawiamy `payment_method_types` w kodzie. Stripe Checkout dobiera dostępne metody automatycznie.
4. BLIK musi być włączony i dostępny w konfiguracji metod płatności konta Stripe.
5. Waluta/country/account muszą być zgodne z wymaganiami Stripe dla BLIK.

Minimalny wzorzec:

```ts
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [
    {
      price: process.env.STRIPE_PRICE_ID!,
      quantity: 1,
    },
  ],
  success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/`,
  // Celowo NIE ustawiamy payment_method_types.
})
```

Nie należy zastępować tego np. przez:

```ts
payment_method_types: ["card"]
```

ponieważ ograniczyłoby to Checkout do wskazanych metod.

## BLIK jest płatnością asynchroniczną

Samo utworzenie lub zakończenie sesji Checkout nie może być podstawą do przyznania płatnego dostępu.

Webhook powinien uwzględniać co najmniej scenariusz:

```ts
case "checkout.session.async_payment_succeeded":
  // zweryfikuj sesję/płatność i dopiero wtedy wykonaj fulfillment
  break
```

Przed wydaniem produktu/licencji należy potwierdzić rzeczywisty stan zapłaty, np. przez pobranie Checkout Session i sprawdzenie `payment_status === "paid"`.

Obsługa `checkout.session.completed` może pozostać dla metod natychmiastowych, ale fulfillment musi być odporny na wielokrotne webhooki (idempotentny) i nie może przyznawać dostępu dla nieopłaconej sesji.

## Zweryfikowana pułapka: Subscription

W kontrolowanym teście 2026-10-07 zachowano tę samą aplikację i konfigurację Stripe, a zmieniono model:

- `mode: "payment"` + one-time Price → **BLIK był widoczny w Stripe Checkout**;
- `mode: "subscription"` + recurring yearly Price → **BLIK nie był dostępny w Checkout**.

Wniosek praktyczny: jeżeli produkt ma zapewniać roczny dostęp, ale BLIK jest wymagany, można rozważyć **jednorazową płatność za 12 miesięcy dostępu** zamiast Stripe Subscription. Okres ważności licencji powinien wtedy być egzekwowany serwerowo przez aplikację (np. `valid_until`), a odnowienie realizowane kolejną jednorazową płatnością.

To nie jest automatyczna subskrypcja Stripe.

## Testowanie

Przy weryfikacji dostępności metod płatności:

- używaj Stripe Test/Sandbox;
- testuj poprawny one-time Price w PLN;
- sprawdź, czy BLIK jest aktywny w Payment Method Configuration;
- otwieraj Checkout również w czystej sesji przeglądarki / po wylogowaniu z Link — zapamiętany klient lub metoda płatności może zmieniać początkowy widok Checkout;
- nie trzeba finalizować płatności, jeśli test dotyczy wyłącznie dostępności metody;
- osobno przetestuj webhook i fulfillment przed użyciem produkcyjnym.

## Źródło odzyskanego wzorca

Mechanizm został odzyskany z historycznego projektu BOS Start / v0 i odtworzony na izolowanym projekcie Vercel `bos-oz`.

Historyczny kod używał:

```ts
const session = await stripe.checkout.sessions.create(
  {
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/success`,
    cancel_url: `${origin}/`,
  },
  {
    idempotencyKey: crypto.randomUUID(),
  },
)
```

Nie było osobnego dostawcy płatności, osobnego endpointu BLIK ani jawnego `payment_method_types: ["blik"]`.

Oryginalny historyczny projekt oraz deployment Vercel pozostają źródłem referencyjnym; ten plik jest skróconą, trwałą instrukcją do ponownego zastosowania mechanizmu.

## Zasada dla przyszłych projektów

Jeżeli wymagamy BLIK w Stripe Checkout:

**najpierw sprawdź `mode: "payment"` + one-time Price + automatyczny dobór metod Stripe + aktywny BLIK w Payment Method Configuration.**

Nie zaczynaj od budowy własnej integracji BLIK, dopóki ten prostszy wzorzec nie został sprawdzony.
