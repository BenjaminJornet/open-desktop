#include <stdio.h>

int main(int argc, char *argv[], char *envp[]) {
    for (char **env = envp; *env != NULL; ++env) {
        fprintf(stdout, "%s%c", *env, '\0');
    }
    
    return 0;
}
