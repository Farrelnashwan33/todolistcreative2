// Import Supabase dari CDN (sudah ada di HTML)
// <script src="https://unpkg.com/@supabase/supabase-js@2"></script>

// 🔑 Ganti dengan data project kamu
const SUPABASE_URL = "https://fsqghvpazalmdtknvzdb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcWdodnBhemFsbWR0a252emRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzQ0ODIsImV4cCI6MjA3MzY1MDQ4Mn0.T6PSP0NhI5ZwEpH-h60jZ3TjOpZ4fmCu5da6WRzhy3c";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ================= REGISTER =================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      alert("❌ Gagal register: " + error.message);
    } else {
      alert("✅ Register sukses! Cek email untuk verifikasi.");
      window.location.href = "login.html";
    }
  });
}

// ================= LOGIN =================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("❌ Login gagal: " + error.message);
    } else {
      alert("✅ Login sukses!");
      window.location.href = "dashboard.html";
    }
  });
}

// ================= DASHBOARD =================
if (window.location.pathname.includes("dashboard.html")) {
  const greetingEl = document.getElementById("greeting");
  const taskList = document.getElementById("taskList");

  // cek user yang login
  supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Greeting
    const now = new Date();
    const hours = now.getHours();
    let greet = "Hello";
    if (hours < 12) greet = "Good Morning";
    else if (hours < 18) greet = "Good Afternoon";
    else greet = "Good Evening";

    greetingEl.innerHTML = `<h2>${greet}, ${user.user_metadata.username || user.email} 👋</h2>`;

    // Load tasks
    loadTasks(user.id);
  });

  // Tambah task
  window.addTask = async function () {
    const taskInput = document.getElementById("taskInput");
    const taskText = taskInput.value.trim();

    if (taskText !== "") {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("tasks").insert([{ user_id: user.id, text: taskText }]);
      taskInput.value = "";
      loadTasks(user.id);
    }
  };

  // Load tasks dari DB
  async function loadTasks(userId) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    taskList.innerHTML = "";
    if (data) {
      data.forEach((task) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="checkbox" ${task.done ? "checked" : ""} onclick="toggleTask('${task.id}')"></td>
          <td class="${task.done ? "task-done" : ""}">${task.text}</td>
          <td><button onclick="deleteTask('${task.id}')" class="btn-secondary">Delete</button></td>
        `;
        taskList.appendChild(row);
      });
    }
  }

  // Toggle selesai
  window.toggleTask = async function (taskId) {
    const { data } = await supabase
      .from("tasks")
      .select("done")
      .eq("id", taskId)
      .single();

    await supabase
      .from("tasks")
      .update({ done: !data.done })
      .eq("id", taskId);

    const { data: { user } } = await supabase.auth.getUser();
    loadTasks(user.id);
  };

  // Hapus task
  window.deleteTask = async function (taskId) {
    await supabase.from("tasks").delete().eq("id", taskId);
    const { data: { user } } = await supabase.auth.getUser();
    loadTasks(user.id);
  };

  // Logout
  window.logout = async function () {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  };
}
