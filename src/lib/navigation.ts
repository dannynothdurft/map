// Apple Maps' universal link opens directly in the native Maps app on
// iPhone/iPad/Mac (Safari/iOS intercepts maps.apple.com links automatically),
// with "dirflg=d" requesting driving directions to the destination.
export function buildNavigationUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
}
