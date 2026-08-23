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
    contactEmail: null, // e.g. "hello@streetsidebins.com"
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
  pricing: [
    {
      id: "curb",
      name: "Curb Service",
      description: "Bins taken from their designated storage spot to the curb before collection.",
      price: null, // TODO: set price, e.g. 24.99
      billingUnit: "month", // shown as "/ month" once price is set
      features: [
        "Bins brought to the curb on your collection day",
        "Trash and recycling bins included",
        "Weekly service",
      ],
      featured: false,
    },
    {
      id: "full",
      name: "Full Service",
      description: "Bins taken to the curb before collection and returned to storage afterward.",
      price: null, // TODO: set price
      billingUnit: "month",
      features: [
        "Everything in Curb Service",
        "Bins returned to storage after pickup",
        "Most popular for busy households",
      ],
      featured: true,
    },
    {
      id: "additional-bins",
      name: "Additional Bins",
      description: "Support for households with more than the standard number of containers.",
      price: null, // TODO: set price, e.g. per extra bin
      billingUnit: "bin / month",
      features: [
        "Add extra trash or recycling bins",
        "Yard waste and compost bins supported",
        "Combine with Curb or Full Service",
      ],
      featured: false,
    },
  ],

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
      a: "Yes. Let us know how many trash and recycling bins you have when you sign up, and see Additional Bins pricing for households with more than the standard number.",
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
      a: null,
      placeholder: "Billing cadence and payment method not yet finalized.",
    },
    {
      q: "Can I cancel?",
      a: null,
      placeholder: "Cancellation policy not yet finalized.",
    },
  ],
};
