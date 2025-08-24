-- Insert sample events into the events table
-- Make sure to run this after the main database schema

USE volunteer_hub;

-- Insert sample events with organizer_id = 36
INSERT INTO events (title, category, date, time, location, description, max_volunteers, organizer_id, image) VALUES
('Beach Cleanup Drive', 'Environment', '2025-10-15', '09:00:00', 'Santa Monica Beach', 'Join us for a community beach cleanup to protect marine life and keep our beaches beautiful.', 50, 36, 'fas fa-leaf'),
('Food Bank Volunteer', 'Community', '2025-09-20', '10:00:00', 'Downtown Community Center', 'Help sort and distribute food to families in need in our community.', 30, 36, 'fas fa-heart'),
('Reading Program for Kids', 'Education', '2025-09-25', '14:00:00', 'Central Library', 'Volunteer to read stories and help children develop their reading skills.', 20, 36, 'fas fa-book'),
('Senior Care Visit', 'Elderly Care', '2025-09-30', '15:00:00', 'Sunset Nursing Home', 'Spend time with elderly residents, play games, and provide companionship.', 15, 36, 'fas fa-user-friends'),
('Animal Shelter Help', 'Animals', '2025-10-05', '11:00:00', 'City Animal Shelter', 'Help care for rescued animals, clean kennels, and assist with adoptions.', 25, 36, 'fas fa-paw'),
('Tree Planting Initiative', 'Environment', '2025-10-10', '08:00:00', 'Central Park', 'Help plant trees to improve air quality and beautify our city parks.', 40, 36, 'fas fa-tree'),
('Homeless Shelter Meal Prep', 'Community', '2025-10-12', '16:00:00', 'Hope Shelter', 'Prepare and serve meals for homeless individuals and families.', 20, 36, 'fas fa-utensils'),
('Youth Mentorship Program', 'Youth Programs', '2025-10-14', '13:00:00', 'Community Youth Center', 'Mentor young people and help them develop life skills and confidence.', 12, 36, 'fas fa-child'),
('Hospital Volunteer Support', 'Healthcare', '2025-10-20', '09:00:00', 'General Hospital', 'Assist hospital staff and provide comfort to patients and families.', 25, 36, 'fas fa-heartbeat'),
('Community Garden Project', 'Environment', '2025-10-22', '10:00:00', 'Riverside Community Garden', 'Help maintain community gardens and teach sustainable farming practices.', 30, 36, 'fas fa-seedling'),
('Holiday Food Drive', 'Community', '2025-11-24', '12:00:00', 'City Hall', 'Collect and distribute holiday meals to families in need.', 50, 36, 'fas fa-gift'),
('Winter Clothing Drive', 'Community', '2025-12-26', '11:00:00', 'Community Center', 'Collect and distribute warm clothing for the winter season.', 40, 36, 'fas fa-tshirt'),
('Pet Adoption Fair', 'Animals', '2026-01-28', '14:00:00', 'City Park', 'Help organize pet adoption events and find homes for rescued animals.', 20, 36, 'fas fa-dog'),
('Disaster Relief Training', 'Disaster Relief', '2026-02-15', '09:00:00', 'Emergency Services Center', 'Learn disaster response skills and help prepare communities for emergencies.', 30, 36, 'fas fa-hands-helping'),
('Literacy Tutoring', 'Education', '2026-03-02', '15:00:00', 'Public Library', 'Tutor adults in reading and writing skills to improve their opportunities.', 25, 36, 'fas fa-graduation-cap'),
('Environmental Cleanup', 'Environment', '2026-04-05', '08:30:00', 'River Trail', 'Clean up natural areas and remove litter to protect wildlife habitats.', 45, 36, 'fas fa-recycle'),
('Blood Drive Campaign', 'Healthcare', '2026-05-15', '10:00:00', 'Medical Center', 'Help organize blood donation drives to support local hospitals.', 20, 36, 'fas fa-tint'),
('School Supply Drive', 'Education', '2026-06-20', '13:00:00', 'Elementary School', 'Collect and distribute school supplies to students in need.', 30, 36, 'fas fa-pencil-alt'),
('Senior Technology Help', 'Elderly Care', '2026-07-25', '14:00:00', 'Senior Center', 'Teach elderly residents how to use smartphones, tablets, and computers.', 15, 36, 'fas fa-laptop'),
('Community Art Project', 'Community', '2026-08-01', '11:00:00', 'Arts Center', 'Help create community murals and art installations.', 25, 36, 'fas fa-palette'),
('Wildlife Conservation', 'Animals', '2026-09-10', '07:00:00', 'Nature Reserve', 'Assist with wildlife monitoring and habitat restoration projects.', 18, 36, 'fas fa-binoculars'),
('Youth Sports Coaching', 'Youth Programs', '2026-10-15', '16:00:00', 'Sports Complex', 'Coach young athletes and promote healthy lifestyle choices.', 22, 36, 'fas fa-futbol'),
('Elderly Meal Delivery', 'Elderly Care', '2026-11-20', '12:00:00', 'Senior Services', 'Deliver nutritious meals to homebound elderly residents.', 20, 36, 'fas fa-truck'),
('Community Health Fair', 'Healthcare', '2026-12-28', '09:00:00', 'Community Center', 'Help organize health screenings and wellness education events.', 35, 36, 'fas fa-stethoscope');