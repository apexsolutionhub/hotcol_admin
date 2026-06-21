# Prisma schema sync — hotcol-user project

The Apex dashboard backend (`GraphQl-BackEnd/prisma/schema.prisma`) added models and fields for **editable module pricing** and **tenant fee overrides**.

Copy the same definitions into your **hotcol-user** `schema.prisma`, then run migrations on that database (shared MySQL).

## New model (add to hotcol-user)

```prisma
model subscription_pricing_rule {
  id               Int      @id @default(autoincrement())
  businessType     String
  modulesKey       String
  modules          Json
  setupFeeETB      Int
  quarterlyFeeETB  Int
  description      String?  @db.Text
  isActive         Boolean  @default(true)
  sortOrder        Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tenants user[]

  @@unique([businessType, modulesKey])
  @@index([businessType])
  @@index([isActive])
}
```

## New fields on `user` (owner row)

```prisma
  feesManuallySet     Boolean   @default(false)
  pricingRuleId       Int?
  pricingRule         subscription_pricing_rule? @relation(fields: [pricingRuleId], references: [id], onDelete: SetNull)
```

Add index:

```prisma
  @@index([pricingRuleId])
```

## After editing schema

From **GraphQl-BackEnd** (or hotcol-user if that owns migrations):

```bash
npx prisma migrate dev --name subscription_pricing_rule
node scripts/seedPricingRules.js
```

**Signup (hotcol-user)** calls `signupPricingPreview` → `resolveSignupPricing` (catalog first, default matrix fallback). Display matches the seed until Apex edits `/pricing`.

**At registration** both `setupFeeETB` and `quarterlyFeeETB` are stored from that effective pricing (+ `pricingRuleId` when a catalog row matches).

**Existing tenants** keep stored fees until Apex applies catalog pricing or edits billing on the dashboard.
