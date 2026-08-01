from ai import balas
from memory import load_memory, save_memory

memory = load_memory()

print("=== AI.Ind ===")

while True:

    pesan = input("Kamu : ")

    if pesan.lower() == "keluar":
        print("AI : Sampai jumpa!")
        break

    jawaban = balas(pesan)

    print("\nAI :", jawaban)

    memory.append({
        "kamu": pesan,
        "ai": jawaban
    })

    save_memory(memory)