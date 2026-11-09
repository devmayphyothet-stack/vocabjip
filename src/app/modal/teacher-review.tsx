import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyReviewLink() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: '/modal/contributor-review', params }} />;
}
