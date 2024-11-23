const usuarios = [
  { id: 1, username: "user1", password: "12345" },
  { id: 2, username: "user2", password: "senha" },
];

function getByLogin(username, password) {
  return usuarios.find(
    (user) => user.username === username && user.password === password
  );
}

function getById(id) {
  return usuarios.find((user) => user.id === id);
}

module.exports = { getByLogin, getById };
