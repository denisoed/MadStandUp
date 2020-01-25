const LocalStorageService = (() => {
  let _service;

  function _getService() {
    if (!_service) {
      _service = this;
      return _service;
    }
    return _service;
  }

  function _setToken(tokenObj) {
    localStorage.setItem('vms__access_token', tokenObj.access_token);
    localStorage.setItem('vms__refresh_token', tokenObj.refresh_token);
  }

  function _getAccessToken() {
    return localStorage.getItem('vms__access_token');
  }

  function _getRefreshToken() {
    return localStorage.getItem('vms__refresh_token');
  }

  function _clearToken() {
    localStorage.removeItem('vms__access_token');
    localStorage.removeItem('vms__refresh_token');
  }
  return {
    getService: _getService,
    setToken: _setToken,
    getAccessToken: _getAccessToken,
    getRefreshToken: _getRefreshToken,
    clearToken: _clearToken
  };
})();

export default LocalStorageService;
