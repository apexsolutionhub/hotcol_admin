# Prisma sync — waiter ordering

Shared DB fields for HotCol Waiter. Apply DDL from **hotcol-user/BackEnd** (`prisma db push` or migrate). Apex GraphQl-BackEnd only needs `prisma generate` (do not `db push` from Apex).

## `tenant_account`

```prisma
  waiterOrderingEnabled Boolean @default(false)
  waiterPaymentApprovalEnabled Boolean @default(false)
```

- `waiterOrderingEnabled` — Apex permit (Café and Restaurant module required).
- `waiterPaymentApprovalEnabled` — Manager/Admin toggle in Waiters & tables.

## `waiter`

```prisma
  passkey  String?  @unique
  isActive Boolean  @default(true)
```

## `Order`

```prisma
  waiterId Int?
  paymentApprovalRequestId Int?
```

## New model `waiter_payment_approval_request`

See `schema.prisma` in hotcol-user / GraphQl-BackEnd (keep mirrored).
