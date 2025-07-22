import { CodiceFiscale } from 'codice-fiscale-js';

export const validateCodiceFiscale = (cf) => {
  try {
    return CodiceFiscale.check(cf);
  } catch(e){
    console.log(e)
    return false;
  }
};

export const formatCodiceFiscale = (cf) => {
  return cf.toUpperCase().replace(/\s/g, '');
};