const baseURL = 'http://localhost:4000/api';

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const modalResult = new bootstrap.Modal(document.getElementById('modalMensagem'));

    const loginData = {
        email: email,
        senha: password
    };

    fetch(`${baseURL}/usuarios/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',

        },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            window.location.href = 'menu.html'
        }
        else if (data.errors) {
            const errorMessage = data.errors.map(error => error.msg).join('<br>');
            // alert('Falha ao efetuar o login:\n' + errorMessage);
            document.getElementById('mensagem').innerHTML =`
                <span class='text-danger'>
                    ${errorMessage}
                </span>
            `;
            modalResult.show();
        }
        else {
            //alert('Não foi possível efetuar o login no servidor.');

            document.getElementById('mensagem').innerHTML =`
                <span class='text-danger'>
                    Não foi possível efetuar o login no servidor.
                </span>
            `;
            modalResult.show();
        }
    })
    .catch(err => {
        console.error(`Erro no login: ${err}`);
    });
})