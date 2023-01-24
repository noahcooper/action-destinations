export const isRequestErrorRetryable = (statusCode: integer) => {
  return statusCode === 401 || statusCode === 429 || statusCode >= 500
}
