import {
  GeocodingResult,
  PlaceAutocompleteResult,
  PlacesReverseResult,
  PlacesSearchResult,
} from './types';

export function mapAutocompleteToSearchResult(prediction: PlaceAutocompleteResult): PlacesSearchResult {
  return {
    place_id: prediction.placeId,
    name: prediction.mainText,
    display_name: prediction.description,
    lat: '',
    lon: '',
    type: prediction.types?.[0] || 'place',
  };
}

export function mapGeocodingToSearchResult(result: GeocodingResult): PlacesSearchResult {
  return {
    place_id: result.placeId,
    name: result.formattedAddress.split(',')[0] || result.formattedAddress,
    display_name: result.formattedAddress,
    lat: result.lat.toString(),
    lon: result.lng.toString(),
    type: result.locationType || 'geocode',
    formatted_address: result.formattedAddress,
  };
}

export function mapReverseGeocoding(
  placeId: string,
  formattedAddress: string,
  lat: number,
  lon: number,
  locationType?: string
): PlacesReverseResult {
  const name = formattedAddress.split(',')[0] || 'Minha Localização';
  return {
    place_id: placeId,
    name: name.trim(),
    display_name: formattedAddress,
    lat: lat.toString(),
    lon: lon.toString(),
    type: locationType || 'geocode',
    formatted_address: formattedAddress,
  };
}
