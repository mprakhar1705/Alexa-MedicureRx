import requests
from bs4 import BeautifulSoup

base_url = "https://druginfo.nlm.nih.gov/drugportal/drug/names/"
alphabet = "abcdeefghijklmnopqrstuvwxyz"
data = []
med_list =[]
file = open("medicines.csv","w")

for letter in alphabet:

    url = base_url + letter;

    r = requests.get(url);

    soup = BeautifulSoup(r.content, "html.parser")
    data = soup.find_all("td", {"align": "left"})
    for i in range(len(data)):
     med_list.append(data[i].contents[0].text+'\n')

for i in med_list:
    file.write(i)
print("Done!")