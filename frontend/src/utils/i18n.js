const dict = {
  en: {
    greeting: 'Good morning',
    findDoctor: 'Find doctor',
    appointments: 'Appointments',
    records: 'Medical records',
    prescriptions: 'Prescriptions',
    labs: 'Lab reports',
    queue: 'Track queue',
    camps: 'Health camps',
    family: 'My family',
    emergency: 'Emergency',
    login: 'Sign in',
    getStarted: 'Get started',
  },
  hi: {
    greeting: 'सुप्रभात',
    findDoctor: 'डॉक्टर खोजें',
    appointments: 'अपॉइंटमेंट',
    records: 'मेडिकल रिकॉर्ड',
    prescriptions: 'पर्चे',
    labs: 'लैब रिपोर्ट',
    queue: 'कतार देखें',
    camps: 'स्वास्थ्य शिविर',
    family: 'मेरा परिवार',
    emergency: 'आपातकाल',
    login: 'साइन इन',
    getStarted: 'शुरू करें',
  },
};

export function t(locale, key) {
  return dict[locale]?.[key] || dict.en[key] || key;
}
