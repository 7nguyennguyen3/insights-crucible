export function getYouTubeVideoId(url: string): string | null {
  const regExp =
    /^.*(http:\/\/googleusercontent.com\/youtube.com\/4\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}
