
console.log('Checking Google API Keys...');
console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? 'DEFINED (starts with ' + process.env.GOOGLE_MAPS_API_KEY.substring(0, 5) + '...)' : 'UNDEFINED');
console.log('GOOGLE_PLACES_API_KEY:', process.env.GOOGLE_PLACES_API_KEY ? 'DEFINED (starts with ' + process.env.GOOGLE_PLACES_API_KEY.substring(0, 5) + '...)' : 'UNDEFINED');
