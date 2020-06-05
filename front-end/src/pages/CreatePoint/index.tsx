import React, { useEffect, useState, ChangeEvent, FormEvent} from 'react';
import { Link, useHistory } from 'react-router-dom';
import {FiArrowLeft} from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import api from '../../services/api';
import './styles.css';
import logo from '../../assets/logo.svg';

interface Item{
    id: number;
    title: string;
    image_url: string; 
}

interface UFresponse{
    sigla: string;
}

interface CityResponse{
    nome: string;
}

const CreatePoint = () =>{

    const [items, setItems]= useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [formData, setFormData] = useState({
        name:'',
        email:'',
        whatsapp:'',
    });
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const history = useHistory();

//carrega posição atual
    useEffect(()=>{
        navigator.geolocation.getCurrentPosition(position =>{
            const {latitude, longitude} = position.coords;

            setInitialPosition([latitude, longitude]);
        });
    }, []);
//retorna os itens de coleta
    useEffect(()=> {
        api.get('items').then(response => {
        setItems(response.data);
        });
    }, []);
//busca de estados API IBGE
    useEffect(()=>{
        axios.get<UFresponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response =>{
            const ufInitials = response.data.map( uf => uf.sigla);

            setUfs(ufInitials);
        });
    }, []);
//Busca de municipios por estado
    useEffect(() => {
        if(selectedUf === '0'){
            return;
        }
        axios.get<CityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response =>{
            const cityNames = response.data.map( ct => ct.nome);
            setCities(cityNames);
        });

    }, [selectedUf]);
//função que pega o estado selecionado
    function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;
        setSelectedUf(uf);
    }
//função que pega a cidade selecionada
    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;
        setSelectedCity(city);
    }
//Função que pega o local selecionado no mapa
    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ]) 
    }
//função que pega os dados do input
    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const {name, value} = event.target;
        
    
        setFormData({ ...formData, [name]: value});
    }
//função que pega os itens selecionados
    function handleSelectedItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if (alreadySelected >=0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        }else {
           setSelectedItems([...selectedItems, id]); 
        }
    }
//função que envia os dados para API
    async function handleSubmit(event: FormEvent){
        event.preventDefault();

        const {name, email, whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name, email, whatsapp, uf, city, latitude, longitude, items
        }

       await api.post('points', data);

       alert('Ponto de coleta criado');

       history.push('/');

    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to="/">
                    <FiArrowLeft/>
                    Voltar para home
                </Link>
            </header>
{/* Nome/Email/Whatsapp */}
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={handleInputChange}/>
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={handleInputChange}/>
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange}/>
                         </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>
{/* MAPA */}
                <Map center = {initialPosition} zoom={15} onclick={handleMapClick}>
                   <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    /> 
                    <Marker position={selectedPosition}/>
                </Map>
{/* Estado/Cidade */}
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectedUf}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf =>(
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="cityf" value={selectedCity} onChange={handleSelectedCity}>
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(ct =>(
                                    <option key={ct} value={ct}>{ct}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
{/* Itens de coleta */}
                <fieldset>
                    <legend>
                        <h2>Ítems de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => (
                            <li key={item.id} onClick={() => handleSelectedItem(item.id)} className={selectedItems.includes(item.id) ? 'selected' : ''}>
                            <img src={item.image_url} alt={item.title}/>
                            <span>{item.title}</span>
                        </li> 
                        ))}
                    </ul>
                </fieldset>
                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    );
};

export default CreatePoint;