const API_URL = "http://localhost:3000/api/clients";

/**
 * Функуия для форматирования даты
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString("ru-RU");
  const formattedTime = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<span class="black-text">${formattedDate}</span> <span class="gray-text">${formattedTime}</span>`;
}

// Функция для отображения контактов клиента
function renderContacts(contacts) {
  return contacts
    .map((contact) => {
      // отдельно для телефона, потому что svg содержит circle и главный цвет для hover
      if (contact.type === "Телефон") {
        return `
          <span class="contact-icon" data-tooltip="${contact.value}">
            <svg class="contact-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.7">
                <circle cx="8" cy="8" r="8" fill="#9873FF" />
                <path d="M11.56 9.50222C11.0133 9.50222 10.4844 9.41333 9.99111 9.25333C9.83556 9.2 9.66222 9.24 9.54222 9.36L8.84444 10.2356C7.58667 9.63556 6.40889 8.50222 5.78222 7.2L6.64889 6.46222C6.76889 6.33778 6.80444 6.16444 6.75556 6.00889C6.59111 5.51556 6.50667 4.98667 6.50667 4.44C6.50667 4.2 6.30667 4 6.06667 4H4.52889C4.28889 4 4 4.10667 4 4.44C4 8.56889 7.43556 12 11.56 12C11.8756 12 12 11.72 12 11.4756V9.94222C12 9.70222 11.8 9.50222 11.56 9.50222Z" fill="white"/>
              </g>
            </svg>
          </span>
        `;
      }

      // Остальные иконки загружаются через <img>
      const icons = {
        Email: "mail.svg",
        VK: "vk.svg",
        Facebook: "fb.svg",
        Другое: "oftop.svg",
      };

      return `
        <span class="contact-icon" data-tooltip="${contact.value}">
          <img class="contact-img" src="icons/${
            icons[contact.type] || "user.svg"
          }" alt="${contact.type}">
        </span>
      `;
    })
    .join(" ");
}

// Функция для заглавных слов
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

let searchTimeout;
let sortColumn = "id";
let sortDirection = "asc";

// Функция для загрузки клиентов за API
async function fetchClients(searchQuery = "") {
  const loader = document.getElementById("loader-container");
  const table = document.querySelector(".main__table");
  const addClientButton = document.getElementById("add-client");

  loader.style.display = "flex";
  table.style.display = "none";
  addClientButton.style.display = "none";

  try {
    let url = API_URL;
    if (searchQuery) {
      url += `?search=${encodeURIComponent(searchQuery)}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Ошибка загрузки данных");

    let clients = await response.json();

    clients = sortClients(clients, sortColumn, sortDirection);
    renderClientsTable(clients); // Отображаем клиентов
  } catch (error) {
    console.error("Ошибка при загрузке клиентов", error);
  } finally {
    loader.style.display = "none";
    table.style.display = "table";
    addClientButton.style.display = "flex";
  }
}

// Функция сортировки данных
function sortClients(clients, column, direction) {
  return clients.sort((a, b) => {
    let valueA, valueB;

    switch (column) {
      case "id":
        valueA = parseInt(a.id);
        valueB = parseInt(b.id);
        break;
      case "fullName":
        valueA = `${a.surname} ${a.name} ${a.lastName}`.toLowerCase();
        valueB = `${b.surname} ${b.name} ${b.lastName}`.toLowerCase();
        break;
      case "createdAt":
      case "updatedAt":
        valueA = new Date(a[column]);
        valueB = new Date(b[column]);
        break;
      default:
        return 0;
    }

    return direction === "asc"
      ? valueA > valueB
        ? 1
        : -1
      : valueA < valueB
      ? 1
      : -1;
  });
}

// Функция для обновления иконок сортировки
function updateSortIcons() {
  document.querySelectorAll(".filter-btn").forEach((button) => {
    const column = button.dataset.column;
    const img = button.querySelector(".sort-icon");
    const text = button.querySelector(".sort-text");

    if (column === sortColumn) {
      const iconName = sortDirection === "asc" ? "up.svg" : "down.svg";
      img.src = `icons/${iconName}`;

      if (column === "fullName") {
        text.textContent = sortDirection === "asc" ? "А-Я" : "Я-А";
      }
    } else {
      img.src = "icons/up.svg"; // Сбрасываем иконку
      if (column === "fullName") text.textContent = "А-Я"; // По умолчанию "А-Я"
    }
  });
}

// Обработчик кликов на кнопки фильтрации
document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", (event) => {
    const column = event.currentTarget.dataset.column;

    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }

    fetchClients();
    updateSortIcons();
  });
});

// Реализация поиска с задержкой 300 мс
document.getElementById("search-input").addEventListener("input", (event) => {
  clearTimeout(searchTimeout);
  const query = event.target.value.trim();

  document.getElementById("loader-container").style.display = "flex";
  document.querySelector(".main__table").style.display = "none";
  document.getElementById("add-client").style.display = "none";

  searchTimeout = setTimeout(() => {
    fetchClients(query);
  }, 300);
});

// Функция для рендеринга таблицы клиетов
function renderClientsTable(clients) {
  const tableBody = document.querySelector(".main__table-body");
  tableBody.innerHTML = ""; // Очищаем таблицу перед добавлением новых данных

  clients.forEach((client) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="id">${client.id}</td>
      <td class="fullName">${capitalizeFirstLetter(client.surname)} 
          ${capitalizeFirstLetter(client.name)} 
          ${capitalizeFirstLetter(client.lastName)}</td>
      <td class="created_at">${formatDate(client.createdAt)}</td>
      <td class="updated_at">${formatDate(client.updatedAt)}</td>
      <td class="contacts">${renderContacts(client.contacts)}</td>
      <td>
        <div class="flex actions">
          <div class="actions-buttons flex">
          <button class="btn-reset edit-btn flex" data-id="${
            client.id
          }" type="button">
              <img src="icons/edit.svg" alt="Изменить" class="icon">
                Изменить
                </button>
          </div>
          <div class="actions-buttons flex">
          <button class="btn-reset delete-btn flex" data-id="${
            client.id
          }" type="button">
              <img src="icons/delete.svg" alt="Удалить" class="icon">
              Удалить
              </button>
          </div>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Обработчик события "Удалить"
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const clientId = event.currentTarget.dataset.id;
      showDeleteModal(clientId);
    });
  });

  // Обработчик события "Изменить"
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const clientId = event.target.dataset.id;
      openEditClientModal(clientId);
    });
  });
}

// Новый клиент
// Открытие модального окна
document.querySelector(".add-client__button").addEventListener("click", () => {
  document.getElementById("add-client-modal").style.display = "flex";
});

// Закрытие модального окна
document.getElementById("close-modal-btn").addEventListener("click", () => {
  document.getElementById("add-client-modal").style.display = "none";
});

function addContactField(container, type = "Телефон", value = "") {
  if (container.children.length >= 10) return; // Ограничиваем до 10 контактов

  const contactDiv = document.createElement("div");
  contactDiv.classList.add("contact");

  contactDiv.innerHTML = `
    <select class="contact-type">
      <option value="Телефон" ${
        type === "Телефон" ? "selected" : ""
      }>Телефон</option>
      <option value="Email" ${type === "Email" ? "selected" : ""}>Email</option>
      <option value="VK" ${type === "VK" ? "selected" : ""}>VK</option>
      <option value="Facebook" ${
        type === "Facebook" ? "selected" : ""
      }>Facebook</option>
      <option value="Другое" ${
        type === "Другое" ? "selected" : ""
      }>Другое</option>
    </select>
    <input type="text" class="contact-value" value="${value}" placeholder="Введите значение" />
    <button class="remove-contact">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 0C2.682 0 0 2.682 0 6C0 9.318 2.682 12 6 12C9.318 12 12 9.318 12 6C12 2.682 9.318 0 6 0ZM6 10.8C3.354 10.8 1.2 8.646 1.2 6C1.2 3.354 3.354 1.2 6 1.2C8.646 1.2 10.8 3.354 10.8 6C10.8 8.646 8.646 10.8 6 10.8ZM8.154 3L6 5.154L3.846 3L3 3.846L5.154 6L3 8.154L3.846 9L6 6.846L8.154 9L9 8.154L6.846 6L9 3.846L8.154 3Z" fill="#B0B0B0"/>
      </svg>
    </button>
  `;

  contactDiv.querySelector(".remove-contact").addEventListener("click", () => {
    contactDiv.remove();
  });

  container.appendChild(contactDiv);
}

document.getElementById("add-contact-btn").addEventListener("click", () => {
  const contactsContainer = document.getElementById("contacts-container");

  addContactField(contactsContainer);

  // Добавляем класс, если есть контакты
  if (contactsContainer.children.length > 0) {
    contactsContainer.classList.add("edit-contacts-container");
  }
});

// Функция для удаления контакта и проверки на пустоту контейнера
function removeContactField(contactElement) {
  const contactsContainer = document.getElementById("contacts-container");

  contactElement.remove();

  if (contactsContainer.children.length === 0) {
    contactsContainer.classList.remove("edit-contacts-container");
  }
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("remove-contact")) {
    removeContactField(event.target.closest(".contact"));
  }
});

// Сохранение нового контакта
document
  .getElementById("save-client-btn")
  .addEventListener("click", async () => {
    const name = capitalizeFirstLetter(
      document.getElementById("client-name").value.trim()
    );
    const surname = capitalizeFirstLetter(
      document.getElementById("client-surname").value.trim()
    );
    const lastName = capitalizeFirstLetter(
      document.getElementById("client-lastname").value.trim()
    );

    // Собираем контакты
    const contacts = Array.from(document.querySelectorAll(".contact")).map(
      (contact) => ({
        type: contact.querySelector(".contact-type").value,
        value: contact.querySelector(".contact-value").value.trim(),
      })
    );

    if (!name || !surname) {
      alert("Имя и фамилия обязательны!");
      return;
    }

    const newClient = { name, surname, lastName, contacts };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });

      if (!response.ok) throw new Error("Ошибка сохранения клиента");

      document.getElementById("add-client-modal").style.display = "none";
      fetchClients(); // Перезагружаем список клиентов
    } catch (error) {
      console.error("Ошибка при сохранении клиента:", error);
    }
  });

document.getElementById("add-close-btn").addEventListener("click", () => {
  document.getElementById("add-client-modal").style.display = "none";
});

// Реализация удаления клиента
let deleteClientId = null;

function showDeleteModal(clientId) {
  deleteClientId = clientId;
  document.getElementById("delete-modal").style.display = "flex";
}

document.getElementById("cancel-delete").addEventListener("click", () => {
  document.getElementById("delete-modal").style.display = "none";
});

document.getElementById("delete-close-btn").addEventListener("click", () => {
  document.getElementById("delete-modal").style.display = "none";
});

// Подтверждение удаления
document
  .getElementById("confirm-delete")
  .addEventListener("click", async () => {
    if (!deleteClientId) return;
    await deleteClient(deleteClientId);
    document.getElementById("delete-modal").style.display = "none";
  });

// Функция удаления
async function deleteClient(clientId) {
  try {
    const response = await fetch(`${API_URL}/${clientId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Ошибка при удалении");

    console.log(`Клиент ${clientId} удален`);
    await fetchClients(); // Обновляем список после удаления
  } catch (error) {
    console.error("Ошибка удаления клиента:", error);
  }
}

// Реализация изменения клиента
let editClientId = null;

async function openEditClientModal(clientId) {
  const modal = document.getElementById("edit-client-modal");
  const loader = document.getElementById("edit-loader");
  const modalContent = document.getElementById("modal-content");

  try {
    // Показываем спиннер, скрываем контент
    loader.style.display = "flex";
    modalContent.style.display = "none";
    modal.style.display = "flex";

    const response = await fetch(`${API_URL}/${clientId}`);
    if (!response.ok) throw new Error("Ошибка загрузки клиента");

    const client = await response.json();
    editClientId = client.id;

    document.getElementById("edit-client-id").textContent = `ID: ${client.id}`;

    // Заполняем форму
    document.getElementById("edit-client-surname").value = client.surname;
    document.getElementById("edit-client-name").value = client.name;
    document.getElementById("edit-client-lastname").value = client.lastName;

    // Очищаем контакты и добавляем их
    const container = document.getElementById("edit-contacts-container");
    container.innerHTML = "";
    client.contacts.forEach((contact) =>
      addContactField(container, contact.type, contact.value)
    );
  } catch (error) {
    console.error("Ошибка при загрузке клиента:", error);
  } finally {
    loader.style.display = "none";
    modalContent.style.display = "flex";
  }
}

// Открытие модального окна
document
  .getElementById("edit-add-contact-btn")
  .addEventListener("click", () => {
    addContactField(document.getElementById("edit-contacts-container"));
  });

// Закрытие модального окна
document.getElementById("edit-close-btn").addEventListener("click", () => {
  document.getElementById("edit-client-modal").style.display = "none";
});

// Сохранение изменений клиента
document
  .getElementById("save-edit-client-btn")
  .addEventListener("click", async () => {
    if (!editClientId) return;

    const name = document.getElementById("edit-client-name").value.trim();
    const surname = document.getElementById("edit-client-surname").value.trim();
    const lastName = document
      .getElementById("edit-client-lastname")
      .value.trim();

    // Собираем контакты
    const contacts = Array.from(
      document.querySelectorAll("#edit-contacts-container .contact")
    ).map((contact) => ({
      type: contact.querySelector(".contact-type").value,
      value: contact.querySelector(".contact-value").value.trim(),
    }));

    if (!name || !surname) {
      alert("Имя и фамилия обязательны!");
      return;
    }

    const updatedClient = { name, surname, lastName, contacts };

    try {
      const response = await fetch(`${API_URL}/${editClientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedClient),
      });

      if (!response.ok) throw new Error("Ошибка обновления клиента");

      document.getElementById("edit-client-modal").style.display = "none";
      fetchClients(); // Перезагружаем список клиентов
    } catch (error) {
      console.error("Ошибка при обновлении клиента:", error);
    }
  });

// Подтверждение удаления клиента при изменении
document.getElementById("delete-client-btn").addEventListener("click", () => {
  document.getElementById("edit-client-modal").style.display = "none";
  document.getElementById("delete-modal").style.display = "flex";
});

document.getElementById("cancel-delete").addEventListener("click", () => {
  document.getElementById("delete-modal").style.display = "none"; // Закрываем окно
});

document
  .getElementById("confirm-delete")
  .addEventListener("click", async () => {
    if (!editClientId) return;
    await deleteClient(editClientId);
    document.getElementById("delete-modal").style.display = "none";
  });

// Загружаем список клиентов при загрузке страницы
document.addEventListener("DOMContentLoaded", () => fetchClients());
