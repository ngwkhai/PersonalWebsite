/**
 * Real-shaped job postings, kept as fixtures because the defect they pin only
 * appears at document length. The old coverage floor was calibrated on short
 * chat queries and every retrieval test used one, so a posting padded with the
 * ordinary "About us" and "Benefits" prose silently switched the lexical half
 * off and nothing in CI noticed.
 *
 * The off-topic postings are here for the other direction: the floor still has
 * to refuse them, or lowering it would just have moved the problem.
 */

export const ML_PLATFORM_JD = `Machine Learning Engineer, Platform — Singapore

About us
We are a fast-growing fintech company backed by tier-one investors. Our mission is to make
financial services accessible to everyone in Southeast Asia. We move quickly, we value
ownership, and we believe great products come from small empowered teams.

Responsibilities
- Design, build and ship production machine learning services that serve millions of requests per day.
- Own model deployment end to end: containerisation, CI/CD, monitoring and rollback.
- Partner with product managers and designers to translate ambiguous business problems into measurable objectives.
- Improve inference latency and throughput on GPU infrastructure.
- Mentor junior engineers and contribute to our engineering culture.

Requirements
- 5+ years of professional software engineering experience, at least 3 in machine learning.
- Strong Python. Experience with PyTorch or TensorFlow in production.
- Hands-on experience with Kubernetes, Docker and at least one major cloud provider.
- Familiarity with distributed training, model quantisation and inference optimisation.
- Fraud detection or risk modelling is a plus.

Benefits
Competitive salary, equity, comprehensive health insurance, generous annual leave, and a
learning budget. We are an equal opportunity employer and value diversity at our company.`;

export const DATA_ANALYST_JD = `Data Analyst, Commercial

Who we are
We are a rapidly scaling consumer marketplace with a friendly, collaborative culture and a
strong bias for action. Our people are our greatest asset.

What you will do
- Build and maintain dashboards that the commercial team relies on every day.
- Write SQL against our warehouse and turn the answers into recommendations.
- Partner with sales and marketing stakeholders to shape their weekly planning.
- Present findings to leadership with clarity and confidence.

What we are looking for
- Two years of analytics experience, ideally in a high-growth environment.
- Advanced SQL and comfort with large, messy datasets.
- Excellent storytelling and stakeholder management.
- A bachelor's degree in a quantitative field.
- Python for analysis is a strong plus.

What we offer
Hybrid working, private medical cover, a generous learning stipend and regular team socials.
We are proud to be an equal opportunity employer.`;

/** Skills the fintech posting names, as the extractor would produce them. */
export const ML_PLATFORM_QUERIES = [
  'production machine learning services deployment',
  'containerisation CI/CD monitoring rollback',
  'inference latency throughput GPU',
  'Python PyTorch TensorFlow',
  'Kubernetes Docker cloud provider',
  'distributed training quantisation inference optimisation',
  'fraud detection risk modelling',
];

export const PASTRY_CHEF_JD = `Pastry Chef — City Centre Bakery

About the bakery
We are a family-run bakery with a loyal following and a warm, busy kitchen. We bake
everything on the premises and we are proud of it.

The role
- Produce viennoiserie, laminated doughs and enriched breads to a consistent standard.
- Manage sourdough starters and daily proving schedules.
- Design a rotating seasonal pastry menu with the head baker.
- Keep the kitchen spotless and compliant with food hygiene regulations.

Requirements
- Formal culinary training or an equivalent apprenticeship.
- Three years in a professional pastry kitchen.
- Early starts, weekends and a genuine love of baking.

We offer
Staff meals, a share of tips, uniform provided and a generous holiday allowance.`;

export const ICU_NURSE_JD = `Registered Nurse — Intensive Care Unit

Our hospital
A busy teaching hospital with a nationally recognised critical care department and a
supportive, close-knit nursing team.

The role
- Deliver direct patient care to critically ill adults on ventilatory support.
- Administer medication, monitor haemodynamics and escalate deterioration promptly.
- Support families through difficult conversations with compassion and clarity.
- Contribute to ward audits and mentor student nurses on placement.

Requirements
- Valid nursing registration and at least two years of post-registration experience.
- Prior intensive care or high dependency experience.
- Advanced life support certification.
- Willingness to work rotating shifts including nights and weekends.

Benefits
Enhanced pension, subsidised parking, continuing professional development funding.`;
