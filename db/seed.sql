INSERT INTO
    users (
        id,
        username,
        password,
        first_name,
        last_name,
        email
    )
VALUES
    (
        'f7b3b3b4-3b7b-4b3b-8b3b-3b7b3b7b3b7a',
        'admin',
        '$2a$10$',
        'Admin',
        'User',
        'admin@localhost'
    );

INSERT INTO
    role (id, name)
VALUES
    (
        'f7b3b3b4-3b7b-4b3b-8b3b-3b7b3b7b3b7b',
        'admin'
    );

INSERT INTO
    user_role (id, user_id, role_id)
VALUES
    (
        'f7b3b3b4-3b7b-4b3b-8b3b-3b7b3b7b3b7c',
        'f7b3b3b4-3b7b-4b3b-8b3b-3b7b3b7b3b7a',
        'f7b3b3b4-3b7b-4b3b-8b3b-3b7b3b7b3b7b'
    );