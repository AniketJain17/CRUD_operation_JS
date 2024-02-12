// Check if there's data saved in local storage
const storedUsers = JSON.parse(localStorage.getItem("users")) || [];

// If there's no data in local storage, fetch data from the API
if (storedUsers.length === 0) {
  $.get(
    "https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json"
  )
    .done(function (data) {
      // Merge the API data with the locally stored data
      const mergedUsers = [...storedUsers, ...data];

      // Display the merged data
      displayUsers(mergedUsers);

      // Save the merged data to local storage
      localStorage.setItem("users", JSON.stringify(mergedUsers));
    })
    .fail(function (error) {
      console.error("Error fetching data:", error);
    });
} else {
  // If data is present in local storage, use it directly
  displayUsers(storedUsers);
}

function displayUsers(users) {
  const tableBody = $("#userTableBody")[0];
  const fragment = document.createDocumentFragment();

  // Add rows to the fragment
  users.forEach((user) => {
    const row = document.createElement("tr");
    row.setAttribute("data-id", user.id);
    row.innerHTML = `<td><input type="checkbox" class="userCheckbox"></td>
        <td>${user.id}</td>
        <td contenteditable="false">${user.name}</td>
        <td contenteditable="false">${user.email}</td>
        <td contenteditable="false">${user.role}</td>
        <td>
        <button class="edit"><i class="fas fa-edit"></i>Edit</button>
        <button class="delete"><i class="fas fa-trash-alt"></i>Delete</button>
          <button class="save" style="display:none;">Save</button>
        </td>`;
    fragment.appendChild(row);
  });
  // Clear existing content and append the fragment
  tableBody.innerHTML = "";
  tableBody.appendChild(fragment);

  // Implement pagination
  const pageSize = 10;
  let currentPage = 1;

  function showPage(page) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    $("tbody tr").hide().slice(startIndex, endIndex).show();
  }

  function updatePaginationButtons() {
    const totalPages = Math.ceil(users.length / pageSize);
    $("#currentPage").text(currentPage);
    $(".first-page").prop("disabled", currentPage === 1);
    $(".previous-page").prop("disabled", currentPage === 1);
    $(".next-page").prop("disabled", currentPage === totalPages);
    $(".last-page").prop("disabled", currentPage === totalPages);
  }

  showPage(currentPage);
  updatePaginationButtons();

  // Event listeners for pagination buttons
  $(".first-page").click(() => {
    currentPage = 1;
    showPage(currentPage);
    updatePaginationButtons();
  });

  $(".previous-page").click(() => {
    if (currentPage > 1) {
      currentPage--;
      showPage(currentPage);
      updatePaginationButtons();
    }
  });

  $(".next-page").click(() => {
    const totalPages = Math.ceil(users.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      showPage(currentPage);
      updatePaginationButtons();
    }
  });

  $(".last-page").click(() => {
    const totalPages = Math.ceil(users.length / pageSize);
    currentPage = totalPages;
    showPage(currentPage);
    updatePaginationButtons();
  });

  // Event listener for the search input
  $("#searchInput").on("input", function () {
    const searchTerm = $(this).val().toLowerCase();

    // Retrieve users from local storage
    let storedUsers = JSON.parse(localStorage.getItem("users")) || [];

    // Filter users based on the search term
    const filteredUsers = storedUsers.filter((user) =>
      Object.values(user).some((value) =>
        value.toString().toLowerCase().includes(searchTerm)
      )
    );

    // Update the table with the filtered data
    displayUsers(filteredUsers);
  });

  // Event listener for the search button
  $("#searchButton").click(() => {
    const searchTerm = $("#searchInput").val().toLowerCase();
    const filteredUsers = users.filter((user) =>
      Object.values(user).some((value) =>
        value.toString().toLowerCase().includes(searchTerm)
      )
    );
    currentPage = 1;
    showPage(currentPage);
    updatePaginationButtons();
  });

  // Event listener for the select all checkbox
  $("#selectAllCheckbox").click(function () {
    $(".userCheckbox").prop("checked", this.checked);
  });

  // Event listener for delete selected button
  $("#deleteSelected").click(() => {
    // Get the IDs of selected users
    const selectedIds = $(".userCheckbox:checked")
      .map(function () {
        return $(this).closest("tr").attr("data-id");
      })
      .get();

    if (selectedIds.length > 0) {
      // Retrieve users from local storage
      const storedUsers = JSON.parse(localStorage.getItem("users")) || [];

      // Update the local storage by removing selected users
      const updatedUsers = storedUsers.filter(
        (user) => !selectedIds.includes(user.id)
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));

      // Display the updated data
      displayUsers(updatedUsers);
      showPage(currentPage);
      updatePaginationButtons();
    }
  });

  // Event listener for edit button
  $("table").on("click", ".edit", function () {
    const row = $(this).closest("tr");
    const userId = row.attr("data-id");

    // Retrieve users from local storage
    let storedUsers = JSON.parse(localStorage.getItem("users")) || [];

    // Find the user with the specified ID
    const editingUser = storedUsers.find((user) => user.id === userId);

    // Check if the user is found
    if (editingUser) {
      // Enable content editing for the row
      row.find('td[contenteditable="false"]').attr("contenteditable", true);

      // Hide edit and delete buttons, show save button
      row.find(".edit, .delete").hide();
      row.find(".save").show();
    } else {
      console.error("User not found for editing.");
    }
  });



  // Event listener for save button
  $("table").on("click", ".save", function () {
    const row = $(this).closest("tr");
    const userId = row.attr("data-id");

    // Retrieve users from local storage
    let storedUsers = JSON.parse(localStorage.getItem("users")) || [];

    // Find the index of the user with the specified ID
    const userIndex = storedUsers.findIndex((user) => user.id === userId);

    // Check if the user is found
    if (userIndex !== -1) {

      const updatedUser = {
        id: userId,
        name: row.find('td:nth-child(3)').text(),
        email: row.find('td:nth-child(4)').text(),
        role: row.find('td:nth-child(5)').text(),
    };
    

      // Update user in array
      storedUsers[userIndex] = updatedUser;

      // Save updated users to storage
      localStorage.setItem("users", JSON.stringify(storedUsers));

      // Disable content editing for the row
      row.find('td[contenteditable="true"]').attr("contenteditable", false);

      // Hide save button, show edit and delete buttons
      row.find(".save").hide();
      row.find(".edit, .delete").show();

      displayUsers(JSON.parse(localStorage.getItem("users")) || []);

      // Optional: Highlight the updated row
      row.addClass("updated-row");

      showPage(currentPage);
      updatePaginationButtons();
    }
  });



  // Event listener for delete button
  $("table").on("click", ".delete", function () {
    const row = $(this).closest("tr");
    const userId = row.attr("data-id");

    // Retrieve users from local storage
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];

    // Update the local storage by removing the user with the specified ID
    const updatedUsers = storedUsers.filter((user) => user.id !== userId);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // Display the updated data
    displayUsers(updatedUsers);
    showPage(currentPage);
    updatePaginationButtons();
  });

}
