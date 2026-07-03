INSERT INTO Employee (Registration_number, Name, FirstName, Birthday, Hiring_date, Department_id, Civilite_id, Manager_id)
VALUES 
    ('REG001', 'Smith', 'John', '1980-05-12', '2010-06-01', 3, 1, NULL),  -- CEO, no manager
    ('REG002', 'Johnson', 'Emily', '1985-08-25', '2012-03-15', 2, 2, NULL),  -- Manager 1
    ('REG003', 'Brown', 'Michael', '1990-12-11', '2015-09-10', 2, 1, NULL),  -- Manager 2
    ('REG004', 'Taylor', 'Sarah', '1992-07-14', '2017-01-20', 2, 2, NULL),  -- Employee under Manager 1
    ('REG005', 'Williams', 'Daniel', '1991-03-09', '2018-05-14', 1, 1, NULL),  -- Employee under Manager 2
    ('REG006', 'Jones', 'Laura', '1988-10-21', '2014-11-05', 2, 2, NULL),  -- Employee under Manager 1
    ('REG007', 'Davis', 'James', '1993-04-17', '2019-02-18', 1, 1, NULL),  -- Employee under Manager 2
    ('REG008', 'Miller', 'Jessica', '1995-11-29', '2020-07-10', 2, 2, NULL),  -- Employee under Manager 1
    ('REG009', 'Wilson', 'Thomas', '1987-01-13', '2013-08-23', 1, 1, NULL),  -- Employee under Manager 2
    ('REG010', 'Moore', 'Sophia', '1996-09-06', '2021-04-12', 4, 2, NULL),  -- Direct report to CEO
    ('REG011', 'Taylor', 'Lucas', '1998-06-30', '2022-10-01', 2, 1, NULL),  -- Employee under Manager 1
    ('REG012', 'Anderson', 'Olivia', '1997-03-03', '2023-01-15', 1, 2, NULL),  -- Employee under Manager 2
    ('REG013', 'Thomas', 'Ethan', '1999-07-22', '2023-05-20', 4, 1, NULL),  -- Direct report to CEO
    ('REG014', 'Harris', 'Isabella', '1989-11-04', '2016-12-01', 2, 2, NULL),  -- Employee under Manager 1
    ('REG015', 'Martin', 'Ava', '1994-02-18', '2019-08-19', 1, 1, NULL);  -- Employee under Manager 2
