# BitFlow - Smart Bitcoin Payment Request Protocol

## Overview

**BitFlow** is a decentralized payment request protocol built on **Stacks Layer 2**, designed to transform Bitcoin commerce through **intelligent payment tags** and **automated settlement**. It enables merchants, freelancers, and individuals to create **time-bound, trustless, programmable payment requests** that settle instantly in **sBTC** while inheriting Bitcoin’s uncompromising security model.

By eliminating traditional intermediaries and embedding business logic directly into payment flows, BitFlow creates a **sovereign, censorship-resistant financial experience** for peer-to-peer Bitcoin payments.

---

## Features

* **Smart Payment Tags** – Create customizable requests with recipient, amount, memo, and expiration parameters.
* **Automated Settlement** – Fulfill requests via secure sBTC transfer directly on Stacks.
* **Time-Bound Contracts** – Tags automatically expire, cancel, or settle, ensuring reliability.
* **Efficient Indexing** – Built-in tracking for both creators and recipients of tags.
* **Protocol Metrics** – Statistics for monitoring adoption, usage, and lifecycle outcomes.
* **Governance & Safety** – Protocol pausing mechanism for emergency response.

---

## System Overview

BitFlow introduces an ecosystem where:

1. **Creators** generate payment tags specifying recipient, amount, expiration, and optional memo.
2. **Recipients** are notified of pending requests and can monitor all associated tags.
3. **Payers** fulfill the tag, transferring the required sBTC amount via the protocol.
4. **Smart Contracts** enforce lifecycle management:

   * **Pending** → initial state
   * **Paid** → upon successful settlement
   * **Canceled** → creator-initiated invalidation
   * **Expired** → auto-marked when expiration threshold is passed

---

## Contract Architecture

BitFlow is implemented as a **single Clarity smart contract** with the following components:

### Core Storage

* **`payment-tags`** – Registry of all payment requests.
* **`creator-index` / `recipient-index`** – Efficient mapping for tag lookups.
* **`contract-stats`** – Tracks lifecycle metrics (created, fulfilled, canceled, expired).
* **State Variables** – `tag-counter` (unique IDs), `contract-paused` (governance flag).

### Lifecycle States

* `pending` → Created, awaiting payment
* `paid` → Settled by payer
* `canceled` → Revoked by creator
* `expired` → Automatically marked post-deadline

### Public Functions

* **`create-payment-tag`** – Generate new request.
* **`fulfill-payment-tag`** – Execute sBTC transfer and settle tag.
* **`cancel-payment-tag`** – Allow creator to revoke pending tag.
* **`expire-payment-tag`** – Publicly callable to mark expired tags.
* **`toggle-contract-pause`** – Governance control for deployer.

### Read-Only Interfaces

* **`get-payment-tag`**, **`get-creator-tags`**, **`get-recipient-tags`**
* **`get-contract-stats`**, **`is-contract-paused`**, **`get-contract-info`**
* **`can-expire-tag`**, **`get-multiple-tags`**

---

## Data Flow

1. **Creation**

   * Creator calls `create-payment-tag` with recipient, amount, expiration, memo.
   * Tag stored in `payment-tags`; indexes updated; event emitted.

2. **Fulfillment**

   * Payer calls `fulfill-payment-tag`.
   * Contract validates state, expiration, and executes sBTC transfer.
   * Tag marked as `paid`; event emitted.

3. **Expiration**

   * Anyone can call `expire-payment-tag` on overdue tags.
   * State updated to `expired`; event emitted.

4. **Cancellation**

   * Creator can call `cancel-payment-tag` before fulfillment.
   * Tag marked as `canceled`; event emitted.

---

## Security & Constraints

* **Spam Prevention**: Minimum payment amount (`MIN-PAYMENT-AMOUNT`).
* **Lifecycle Integrity**: Strict validation of states and expirations.
* **Index Limits**: Max 100 tags per user for efficient on-chain queries.
* **Governance**: Deployer-controlled `contract-paused` safeguard.

---

## Deployment Notes

* **Token Integration**: Contract integrates with the official sBTC contract (`SBTC-CONTRACT`).
* **Constants**: Update contract addresses for production deployment.
* **Expiration**: Max 30 days (`MAX-EXPIRATION-BLOCKS`) to prevent indefinite locks.

---

## Contract Metadata

```clarity
(get-contract-info)
=> {
  name: "BitFlow - Smart Bitcoin Payment Request Protocol",
  version: "1.0.0",
  deployer: <contract-deployer>,
  total-tags: <uint>,
  paused: <bool>,
  description: "Revolutionary trustless Bitcoin payment infrastructure on Stacks Layer 2",
}
```

---

## Events

BitFlow emits structured logs for external indexers:

* `payment-tag-created`
* `payment-tag-fulfilled`
* `payment-tag-canceled`
* `payment-tag-expired`
* `contract-pause-toggled`

---

## License

This project is released under the **MIT License**.

---

Would you like me to also include an **ASCII-style architecture diagram** (showing actors → contract → sBTC transfer) for the README, or keep it text-based and professional only?
