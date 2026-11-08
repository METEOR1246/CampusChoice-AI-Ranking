/**
 * Fictional demonstration dataset for CampusChoice (Milestone 2).
 *
 * All ten events are invented for the University of Birmingham
 * Intelligent Interactive Systems Assignment 2 prototype. They are NOT real
 * events and no booking or payment is possible.
 *
 * @typedef {Object} Event
 * @property {string} id          Stable identifier (also the ranking tie-breaker).
 * @property {string} title       Display name of the event.
 * @property {string} category    One of the five preference categories.
 * @property {string} day         Day of the week.
 * @property {string} time        24-hour start time, e.g. "19:00".
 * @property {number} price       Ticket price in GBP (0 means free).
 * @property {string} description Short descriptive text shown in the details view.
 * @property {string[]} tags      Interest tags used for browsing/context.
 */

/** @type {Event[]} */
export const EVENTS = [
  {
    id: 'E01',
    title: 'Coding Workshop',
    category: 'Technology',
    day: 'Wednesday',
    time: '19:00',
    price: 10,
    description:
      'A hands-on evening workshop where students build a small web app from scratch. Laptops are provided and beginners are very welcome.',
    tags: ['coding', 'web', 'beginners', 'hands-on'],
  },
  {
    id: 'E02',
    title: 'AI Ethics Seminar',
    category: 'Technology',
    day: 'Tuesday',
    time: '14:00',
    price: 10,
    description:
      'A guest-led seminar debating fairness, transparency and accountability in modern AI systems, followed by an open question-and-answer session.',
    tags: ['ai', 'ethics', 'seminar', 'debate'],
  },
  {
    id: 'E03',
    title: 'Graduate Careers Fair',
    category: 'Career',
    day: 'Thursday',
    time: '14:00',
    price: 0,
    description:
      'Meet graduate recruiters from local and national employers, explore internships and graduate schemes, and get CV advice on the day.',
    tags: ['careers', 'employers', 'internships', 'networking'],
  },
  {
    id: 'E04',
    title: 'Interview Skills Clinic',
    category: 'Career',
    day: 'Monday',
    time: '19:00',
    price: 5,
    description:
      'Practise competency-based interview questions with trained careers advisers and receive structured feedback on your answers.',
    tags: ['interviews', 'careers', 'practice', 'feedback'],
  },
  {
    id: 'E05',
    title: 'Football Social',
    category: 'Sports',
    day: 'Friday',
    time: '19:00',
    price: 0,
    description:
      'Casual five-a-side football followed by a social in the campus bar. All abilities are welcome — just bring trainers.',
    tags: ['football', 'social', 'fitness', 'team'],
  },
  {
    id: 'E06',
    title: 'Campus Yoga',
    category: 'Sports',
    day: 'Tuesday',
    time: '10:00',
    price: 5,
    description:
      'A relaxed morning yoga session focused on posture, breathing and stress relief. Mats are provided.',
    tags: ['yoga', 'wellbeing', 'fitness', 'relaxation'],
  },
  {
    id: 'E07',
    title: 'Student Music Night',
    category: 'Arts',
    day: 'Saturday',
    time: '19:00',
    price: 10,
    description:
      'An evening of live performances from student bands and solo artists across a range of genres, hosted in the campus union.',
    tags: ['music', 'live', 'performance', 'social'],
  },
  {
    id: 'E08',
    title: 'Photography Walk',
    category: 'Arts',
    day: 'Saturday',
    time: '14:00',
    price: 0,
    description:
      'A guided walk around campus and the local area to practise composition and lighting. Bring any camera or a phone.',
    tags: ['photography', 'walk', 'creative', 'outdoors'],
  },
  {
    id: 'E09',
    title: 'Community Volunteering Meetup',
    category: 'Community',
    day: 'Wednesday',
    time: '19:00',
    price: 0,
    description:
      'Meet local volunteering groups, find out about current projects and sign up for causes that match your interests.',
    tags: ['volunteering', 'community', 'social-impact', 'meetup'],
  },
  {
    id: 'E10',
    title: 'International Food Exchange',
    category: 'Community',
    day: 'Sunday',
    time: '14:00',
    price: 5,
    description:
      'Share and taste dishes from around the world. Bring a dish if you can, or simply come along to meet new people.',
    tags: ['food', 'culture', 'international', 'social'],
  },
];
