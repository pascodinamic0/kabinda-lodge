-- Create trigger to update room status when bookings are created/updated/deleted
CREATE OR REPLACE TRIGGER update_room_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_room_status_on_booking();