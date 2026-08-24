/**
 * STREETSIDE — SITE CONFIG
 * ---------------------------------------------------------------
 * This is the one file you should need to touch most often.
 * It holds the business details that change over time: pricing,
 * service area, contact info, and the neighbor counter / waitlist
 * form wiring. Everything here is plain data — no page markup.
 *
 * Anything marked TODO must be filled in before you consider the
 * site "launch ready." Nothing marked TODO is shown to visitors
 * as if it were real (see how each value is used in main.js).
 * ---------------------------------------------------------------
 */

window.STREETSIDE_CONFIG = {
  business: {
    name: "Streetside",
    fullName: "Streetside Waste & Property Services",
    tagline: "We take it to the street. You don't have to.",
    serviceRegion: "Southeastern Columbus",
    // TODO: real support contact details before launch.
    contactEmail: null, // e.g. "hello@streetsideoh.com"
    contactPhone: null, // e.g. "(740) 555-0100"
    socialLinks: {
      instagram: "https://www.instagram.com/streetside_wnps",
      facebook: "https://www.facebook.com/profile.php?id=61593453727059",
      tiktok: "https://www.tiktok.com/@streetside56",
    },
  },

  /**
   * NEIGHBOR COUNTER
   * -----------------
   * `count` is the ONLY number ever shown to visitors, and it must
   * start at 0 until real signups exist — never invent a number here.
   *
   * `source` documents where the number should eventually come from.
   * Right now it's "manual" (edit `count` by hand as real people join).
   * When you have a backend, change source to "api" and set
   * `apiEndpoint` to a route that returns { count: number }; the
   * counter component (see scripts/counter.js) will fetch it instead.
   */
  neighborCounter: {
    source: "api", // "manual" | "api"
    count: 0,
    apiEndpoint: "/api/neighbor-count",
    // Optional future feature described in the brief — only turn this on
    // once a real per-route threshold exists. Leave null until then.
    nextRouteThreshold: null,
  },

  /**
   * WAITLIST FORM
   * -----------------
   * There is no backend wired up yet. `endpoint` is where the form
   * will POST its data as JSON once you connect one — for example a
   * Formspree/Getform/Basin endpoint, or your own serverless function.
   * Until `endpoint` is set, the form will NOT claim to have saved
   * anything: see scripts/waitlist-form.js for exactly what happens.
   */
  waitlistForm: {
    endpoint: "/api/waitlist",
    hearAboutUsOptions: [
      "Neighbor / word of mouth",
      "Social media",
      "Google search",
      "Flyer or mailer",
      "Local event",
      "Other",
    ],
  },

  /**
   * PRICING
   * -----------------
   * No real prices have been supplied yet. Each `price` is null and
   * the site displays a "pricing coming soon" state instead of a
   * dollar amount — see how price-card renders this in main.js.
   * Fill these in with real, approved prices before launch.
   */
  /**
   * PRICING
   * -----------------
   * Real pricing, decided by the business owner (not invented).
   * Subscription is the core offering — a flat weekly bin-out-and-back
   * service, priced per month with a per-extra-can add-on. One-time
   * service exists for people who need it just once. The Founding 250
   * offer is a real, decided promotion for the first 250 subscribers,
   * but its "spots remaining" is NOT tracked live here — there's no
   * payment/subscriber system built yet, only a waitlist. Don't wire
   * this to a live countdown until that exists; a fabricated number
   * would be worse than none.
   */
  pricingTiers: [
    {
      id: "curb",
      name: "Curb Service",
      description: "Bins taken from their designated storage spot to the curb before collection.",
      price: 12.5,
      billingUnit: "month",
      features: [
        "Bins taken to the curb before collection",
        "Trash and recycling bins included",
        "Weekly service, every week",
        "+$10/month for each additional can",
      ],
      featured: false,
    },
    {
      id: "full",
      name: "Full Service",
      description: "Bins taken to the curb before collection and returned to storage afterward.",
      price: 25,
      billingUnit: "month",
      features: [
        "Everything in Curb Service",
        "Bins returned to storage after pickup",
        "Weekly service, every week",
        "+$10/month for each additional can",
      ],
      featured: true,
    },
  ],

  oneTimeService: {
    name: "One-Time Service",
    description: "Need it just once — a single trip, an injury, an event? We've got you covered without a subscription.",
    price: 10,
  },

  foundingOffer: {
    enabled: true,
    name: "Founding 250",
    headline: "Lock in founding-member pricing.",
    description: "The first 250 subscribers get 50% off their first month, and their rate locked in for 2 years, as long as they stay subscribed.",
    discountPercent: 50,
    discountMonths: 1,
    lockYears: 2,
    spotsTotal: 250,
    // Intentionally no "spotsRemaining" — see note above.
  },

  /**
   * SERVICE AREA
   * -----------------
   * Seed list only — structured so cities/ZIPs/neighborhoods can be
   * added as routes open. No real address-verification system is
   * connected yet, so the "check your address" tool always collects
   * the submission as a waitlist / service-interest entry rather
   * than claiming to confirm availability in real time.
   */
  serviceArea: {
    region: "Southeastern Columbus",
    // TODO: list real cities/neighborhoods as routes are confirmed.
    activeAreas: [],
    waitlistAreas: [],
  },

  faq: [
    {
      q: "What exactly does Streetside do?",
      a: "Streetside moves your trash and recycling bins from their normal storage spot to the curb before your regular collection day, then returns them to storage once they've been emptied.",
    },
    {
      q: "Does Streetside collect my garbage?",
      a: "No. Streetside does not collect, haul, or dispose of garbage. Your existing waste company still collects and empties your bins — we simply handle getting them to and from the curb.",
    },
    {
      q: "Does Streetside replace my current waste company?",
      a: "No. You keep your existing trash and recycling provider. Streetside works alongside them, not instead of them.",
    },
    {
      q: "When do you take my bins out?",
      a: "Before your scheduled collection day, based on the collection schedule you provide when you sign up.",
      placeholder: "Exact timing windows (e.g. evening before vs. morning of) to be finalized before launch.",
    },
    {
      q: "When do you bring them back?",
      a: "After your waste company has emptied them on collection day.",
      placeholder: "Exact same-day timing to be finalized before launch.",
    },
    {
      q: "Can you handle recycling?",
      a: "Yes. Recycling bins are included as part of the service alongside trash bins.",
    },
    {
      q: "Can I register multiple bins?",
      a: "Yes. Let us know how many trash and recycling bins you have when you sign up — each additional can beyond the first is $10/month, shown on the pricing plans above.",
    },
    {
      q: "Where should I leave my bins?",
      a: "You tell us where your bins are normally stored (for example, the side yard or garage) when you sign up, and we return them to that same spot.",
    },
    {
      q: "What happens if trash collection is delayed?",
      a: null,
      placeholder: "Policy for delayed collection days (weather, provider delays, etc.) not yet finalized.",
    },
    {
      q: "What happens during holiday collection schedules?",
      a: null,
      placeholder: "Holiday schedule policy not yet finalized.",
    },
    {
      q: "What if my collection day changes?",
      a: "Let us know and we'll update your account to match your new collection day.",
    },
    {
      q: "Can Streetside handle my bins while I'm away?",
      a: "Yes — this is one of the most common reasons neighbors use Streetside. Just make sure your account reflects your normal collection schedule.",
    },
    {
      q: "Where is Streetside available?",
      a: "Streetside is launching in Southeastern Columbus and is opening routes neighborhood by neighborhood based on signups.",
    },
    {
      q: "What if my neighborhood isn't available?",
      a: "Join the waitlist with your address. Routes open once enough neighbors in an area have signed up, so every signup helps bring Streetside closer.",
    },
    {
      q: "How will I know my bins were serviced?",
      a: null,
      placeholder: "Service confirmation method (e.g. text/email notification) not yet finalized.",
    },
    {
      q: "How does billing work?",
      a: "Billing is monthly, based on the plan you choose. Founding 250 members get 50% off their first month, then their regular rate for as long as they stay subscribed — locked in for 2 years.",
      placeholder: "Exact payment method/processor not yet finalized.",
    },
    {
      q: "Can I cancel?",
      a: null,
      placeholder: "Cancellation policy not yet finalized.",
    },
  ],
};
