;; Title: BitFlow - Smart Bitcoin Payment Request Protocol
;;
;; Summary: A revolutionary trustless payment infrastructure that transforms
;; Bitcoin commerce through intelligent payment tags and automated
;; settlement on Stacks Layer 2, enabling seamless peer-to-peer
;; transactions with time-bound smart contracts.
;;
;; Description: BitFlow redefines the future of Bitcoin commerce by creating
;; an advanced decentralized payment request ecosystem. The protocol
;; empowers merchants, freelancers, service providers, and individuals
;; to generate sophisticated time-bound payment tags with customizable
;; parameters including recipient designation, precise amounts, and
;; contextual memos. By harnessing the power of sBTC for instantaneous
;; settlement while preserving Bitcoin's uncompromising security model
;; through Stacks Layer 2 architecture, BitFlow eliminates traditional
;; payment intermediaries and creates a truly sovereign financial
;; experience. The protocol features intelligent expiration management,
;; comprehensive indexing systems, and robust state tracking to ensure
;; reliable and efficient payment processing at scale.

;; ERROR CODES & SYSTEM CONSTANTS

;; Core System Error Definitions
(define-constant ERR-TAG-EXISTS u100)
(define-constant ERR-NOT-PENDING u101)
(define-constant ERR-INSUFFICIENT-FUNDS u102)
(define-constant ERR-NOT-FOUND u103)
(define-constant ERR-UNAUTHORIZED u104)
(define-constant ERR-EXPIRED u105)
(define-constant ERR-INVALID-AMOUNT u106)
(define-constant ERR-EMPTY-MEMO u107)
(define-constant ERR-MAX-EXPIRATION-EXCEEDED u108)
(define-constant ERR-INVALID-RECIPIENT u109)
(define-constant ERR-SELF-PAYMENT u110)

;; Payment Tag Lifecycle State Constants
(define-constant STATE-PENDING "pending")
(define-constant STATE-PAID "paid")
(define-constant STATE-EXPIRED "expired")
(define-constant STATE-CANCELED "canceled")

;; PROTOCOL CONFIGURATION & INTEGRATION

;; sBTC Token Contract Integration
;; Production mainnet address - update during deployment
(define-constant SBTC-CONTRACT 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token)

;; Protocol Administrator
(define-constant CONTRACT-DEPLOYER tx-sender)

;; Protocol Operational Limits & Security Constraints
(define-constant MAX-EXPIRATION-BLOCKS u4320) ;; 30 days (~10 min/block)
(define-constant MAX-TAGS-PER-USER u100) ;; Efficient indexing limit
(define-constant MIN-PAYMENT-AMOUNT u1000) ;; 0.00001 sBTC spam prevention

;; DATA STRUCTURES & PERSISTENT STORAGE

;; Core Payment Tag Registry
(define-map payment-tags
  { id: uint }
  {
    creator: principal,
    recipient: principal,
    amount: uint,
    created-at: uint,
    expires-at: uint,
    memo: (optional (string-ascii 256)),
    state: (string-ascii 16),
    payment-tx: (optional (buff 32)),
    payment-block: (optional uint),
  }
)

;; Creator Indexing for Efficient Query Operations
(define-map creator-index
  { creator: principal }
  {
    tag-ids: (list 100 uint),
    count: uint,
  }
)

;; Recipient Indexing for Payment Tracking & Analytics
(define-map recipient-index
  { recipient: principal }
  {
    tag-ids: (list 100 uint),
    count: uint,
  }
)

;; Protocol Analytics & Performance Metrics
(define-map contract-stats
  { key: (string-ascii 32) }
  { value: uint }
)

;; STATE VARIABLES

(define-data-var tag-counter uint u0)
(define-data-var contract-paused bool false)

;; INTERNAL HELPER FUNCTIONS

;; Add Payment Tag to Creator's Index
(define-private (add-to-creator-index
    (creator principal)
    (tag-id uint)
  )
  (let (
      (current-data (default-to {
        tag-ids: (list),
        count: u0,
      }
        (map-get? creator-index { creator: creator })
      ))
      (current-list (get tag-ids current-data))
      (current-count (get count current-data))
    )
    (match (as-max-len? (append current-list tag-id) u100)
      new-list (begin
        (map-set creator-index { creator: creator } {
          tag-ids: new-list,
          count: (+ current-count u1),
        })
        true
      )
      false
    )
  )
)
