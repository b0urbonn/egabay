-- Completes the sample terminal pins from 20261106000000_barangay_terminal_pins.
-- That pass used a case-sensitive 'Sample TODA service point:%' match, but the
-- generated service points are named 'Sample toda service point:%', so only the
-- pickup points were pinned. The six municipal TODA service hubs were never
-- geocoded either. Positions stay is_sample and unverified.

-- Service points inherit the pickup pin already placed for the same barangay
-- (pickups carry a +0.0007 nudge, removed here so both markers sit apart).
update public.terminals service_point
set latitude = pickup.latitude - 0.0007,
    longitude = pickup.longitude - 0.0007,
    address = pickup.address
from public.terminals pickup
where service_point.is_sample
  and service_point.name ilike 'Sample toda service point:%'
  and service_point.latitude is null
  and pickup.is_sample
  and pickup.name ilike 'Sample toda pickup point:%'
  and pickup.latitude is not null
  and pickup.municipality = service_point.municipality
  and pickup.barangay = service_point.barangay;

-- Municipal TODA service hubs sit on their town centers.
update public.terminals terminal
set latitude = hub.latitude,
    longitude = hub.longitude,
    address = 'Municipal service hub; confirm the exact boarding point'
from (values
  ('Boac', 13.447, 121.8403),
  ('Buenavista', 13.2567, 121.944),
  ('Gasan', 13.3228, 121.846),
  ('Mogpog', 13.4739, 121.8607),
  ('Santa Cruz', 13.4749, 122.0508),
  ('Torrijos', 13.3197, 122.0849)
) hub(municipality, latitude, longitude)
where terminal.is_sample
  and terminal.municipality = hub.municipality
  and terminal.name like '%TODA Service Hub (Sample)'
  and terminal.latitude is null;
