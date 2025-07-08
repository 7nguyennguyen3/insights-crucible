import apiClient from "./apiClient";

/**
 * A generic fetcher function for use with SWR.
 * It takes a URL, makes a GET request using our apiClient, and returns the data.
 * @param url The API endpoint to fetch.
 */
export const fetcher = (url: string) =>
  apiClient.get(url).then((res) => res.data);
