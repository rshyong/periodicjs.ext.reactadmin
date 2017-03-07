import { fetchComponent, checkStatus, fetchPaths, } from './fetchComponent';
import { traverse, } from './traverse';
import { requireAuth, isLoggedIn, } from './routing';
import { getParameterized, parameterize, setParameters, findMatchingRoute, } from './parameterize';
import { fetchErrorContent, fetchSuccessContent, fetchDynamicContent, fetchAction, } from './dynamics';

export default {
  fetchComponent,
  checkStatus,
  fetchPaths,
  traverse,
  requireAuth,
  isLoggedIn,
  getParameterized,
  parameterize,
  setParameters,
  findMatchingRoute,
  fetchAction,
  fetchErrorContent,
  fetchSuccessContent,
  fetchDynamicContent,
};
